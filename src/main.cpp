#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <time.h>
#include <math.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#if __has_include("secrets.h")
#include "secrets.h"
#else
#error "Create include/secrets.h from include/secrets.example.h and set your Wi-Fi credentials."
#endif

#include "display.h"
#include "ntu_sensor.h"
#include "ph_sensor.h"
#include "tds_sensor.h"

#if !defined(NEERGUARD_WIFI_SSID) || !defined(NEERGUARD_WIFI_PASSWORD)
#error "Define NEERGUARD_WIFI_SSID and NEERGUARD_WIFI_PASSWORD in include/secrets.h."
#endif

static_assert(PH_SENSOR_PIN != TDS_SENSOR_PIN, "pH and TDS sensors must use separate ADC pins.");

namespace {

constexpr float CLEAR_WATER_VOLTAGE_THRESHOLD = 4.75f;
constexpr uint32_t SAMPLE_INTERVAL_MS = 30000UL;

struct SensorSnapshot {
  float ph = NAN;
  float turbidity = NAN;
  float tds = NAN;
  time_t sampledAt = 0;
  uint32_t sequence = 0;
};

WebServer server(80);
SemaphoreHandle_t snapshotMutex;
SensorSnapshot latest;

String timestampFor(time_t value) {
  if (value <= 0) return String();
  struct tm timeInfo;
  gmtime_r(&value, &timeInfo);
  char timestamp[25];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(timestamp);
}

String jsonValue(float value) {
  return isfinite(value) ? String(value, 2) : String("null");
}

String measurementJson(float value, const char* unit, const String& timestamp) {
  const bool valid = isfinite(value) && timestamp.length() > 0;
  return String("{\"value\":") + (valid ? jsonValue(value) : String("null"))
    + ",\"unit\":\"" + unit + "\",\"valid\":" + (valid ? "true" : "false")
    + ",\"calibrated\":false,\"timestamp\":\"" + timestamp + "\"}";
}

String readingJson() {
  SensorSnapshot copy;
  xSemaphoreTake(snapshotMutex, portMAX_DELAY);
  copy = latest;
  xSemaphoreGive(snapshotMutex);

  const String timestamp = timestampFor(copy.sampledAt);
  const String id = String("esp32-") + copy.sequence;
  return String("{\"id\":\"") + id + "\",\"timestamp\":\"" + timestamp
    + "\",\"measurements\":{\"ph\":" + measurementJson(copy.ph, "pH", timestamp)
    + ",\"turbidity\":" + measurementJson(copy.turbidity, "NTU", timestamp)
    + ",\"tds\":" + measurementJson(copy.tds, "ppm", timestamp)
    + ",\"temperature\":{\"value\":null,\"unit\":\"°C\",\"valid\":false,"
      "\"calibrated\":false,\"timestamp\":\"" + timestamp + "\","
      "\"error\":\"Temperature sensor is not installed\"}}}";
}

void sendJson(int statusCode, const String& body) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Cache-Control", "no-store");
  server.send(statusCode, "application/json", body);
}

void sendHealth() {
  const String timestamp = timestampFor(time(nullptr));
  sendJson(200, String("{\"status\":\"ok\",\"checkedAt\":\"") + timestamp
    + "\",\"deviceConnected\":" + (WiFi.isConnected() ? "true" : "false") + "}");
}

void sendDevice() {
  SensorSnapshot copy;
  xSemaphoreTake(snapshotMutex, portMAX_DELAY);
  copy = latest;
  xSemaphoreGive(snapshotMutex);

  const String timestamp = timestampFor(copy.sampledAt);
  const bool connected = WiFi.isConnected();
  sendJson(200, String("{\"deviceId\":\"NEERGUARD-ESP32\",\"firmwareVersion\":\"0.2.0\",")
    + "\"connected\":" + (connected ? "true" : "false")
    + ",\"apiConnected\":true,\"lastContact\":"
    + (timestamp.length() > 0 ? String("\"") + timestamp + "\"" : String("null"))
    + ",\"configured\":true,\"supportedParameters\":[\"ph\",\"turbidity\",\"tds\"]}");
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Accept");
  server.send(204);
}

void handleNotFound() {
  if (server.method() == HTTP_OPTIONS) {
    handleOptions();
    return;
  }
  sendJson(404, "{\"error\":\"Not found\"}");
}

void startApi() {
  server.on("/api/health", HTTP_GET, sendHealth);
  server.on("/api/device", HTTP_GET, sendDevice);
  server.on("/api/readings/latest", HTTP_GET, []() {
    SensorSnapshot copy;
    xSemaphoreTake(snapshotMutex, portMAX_DELAY);
    copy = latest;
    xSemaphoreGive(snapshotMutex);
    const String body = copy.sequence == 0 ? String("null") : readingJson();
    sendJson(200, body);
  });
  server.on("/api/readings", HTTP_GET, []() {
    SensorSnapshot copy;
    xSemaphoreTake(snapshotMutex, portMAX_DELAY);
    copy = latest;
    xSemaphoreGive(snapshotMutex);
    const String body = copy.sequence == 0 ? String("[]") : String("[") + readingJson() + "]";
    sendJson(200, body);
  });
  server.on("/api/events", HTTP_GET, []() { sendJson(200, "[]"); });
  server.onNotFound(handleNotFound);
  server.begin();
}

void sampleSensors(void*) {
  for (;;) {
    float turbidity = NAN;
    float ph = NAN;
    float tds = NAN;

    readTurbiditySensor(turbidity, CLEAR_WATER_VOLTAGE_THRESHOLD);
    ph = readPH();
    readTDSSensor(tds);

    xSemaphoreTake(snapshotMutex, portMAX_DELAY);
    latest.ph = ph;
    latest.turbidity = turbidity;
    latest.tds = tds;
    latest.sampledAt = time(nullptr);
    latest.sequence++;
    const uint32_t sequence = latest.sequence;
    xSemaphoreGive(snapshotMutex);

    Serial.printf("Sensor sample %lu | turbidity: %.2f NTU | pH: %.2f | TDS: %.2f ppm\n",
      static_cast<unsigned long>(sequence), turbidity, ph, tds);
    vTaskDelay(pdMS_TO_TICKS(SAMPLE_INTERVAL_MS));
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  snapshotMutex = xSemaphoreCreateMutex();
  if (snapshotMutex == nullptr) {
    Serial.println("Could not create sensor-data mutex.");
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(NEERGUARD_WIFI_SSID, NEERGUARD_WIFI_PASSWORD);
  Serial.println("Connecting to Wi-Fi.");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  setupDisplay();
  displayClear();
  displayPrint("NEERGUARD");
  setupPH();
  startApi();
  xTaskCreate(sampleSensors, "sensor-sampling", 8192, nullptr, 1, nullptr);
  Serial.println("NEERGUARD API ready. Configure the app with the IP address above.");
}

void loop() {
  server.handleClient();
  delay(2);
}
