#ifndef TEMPERATURE_SENSOR_H
#define TEMPERATURE_SENSOR_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// --- CONFIGURATION ---
#if defined(ESP8266)
  const int ONE_WIRE_BUS = 4;   // D2 on NodeMCU/ESP8266
#elif defined(ESP32)
  const int ONE_WIRE_BUS = 2;   // GPIO 4 on ESP32 (can be changed to any digital pin)
#else
  const int ONE_WIRE_BUS = 2;   // Standard Arduino Uno pin
#endif

// Setup OneWire instance to communicate with any OneWire devices
OneWire oneWire(ONE_WIRE_BUS);

// Pass our OneWire reference to Dallas Temperature library
DallasTemperature sensors(&oneWire);

void setupTemperature() {
  pinMode(ONE_WIRE_BUS, INPUT_PULLUP); // Ensure the pin is set as input with pull-up
  Serial.println("Temperature sensor initialized on pin " + String(ONE_WIRE_BUS));
}

float readTemperature() {
  // Request temperature conversion from all sensors on the bus
  sensors.requestTemperatures(); 
  
  // Read temperature in Celsius from the first device found (index 0)
  float tempC = sensors.getTempCByIndex(0);

  // Error check: DS18B20 returns -127.00 if disconnected or wired wrong
  if (tempC == -127.00 || tempC == 85.00) {
    Serial.println("Warning: DS18B20 temperature sensor not detected! Defaulting to 25.0°C");
    return 25.0; // Fallback to standard room temp
  }

  // Print diagnostic value
  Serial.print("Water Temp: ");
  Serial.print(tempC, 2);
  Serial.println(" °C");

  return tempC;
}

#endif