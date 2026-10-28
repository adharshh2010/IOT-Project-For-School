#include <Arduino.h>
#include <Wire.h> 
#include <WiFi.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// put function declarations here:
// Example: int myFunction(int, int);

int NTUcalculator(float sensorVoltage, float &turbidityNTU, float clearWaterVoltageThreshold);

// put global variables and definitions here:
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET    -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

const char* ssid = "AirFiber-Ihooc8-gk"; // Replace with your network SSID
const char* password = "Gktraders@rajithagopakumar"; // Replace with your network password

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const int TURBIDITY_SENSOR_PIN = 34; // Pin connected to the turbidity sensor
const int ADC_RESOLUTION = 4095;


void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);

  WiFi.mode(WIFI_STA); // Set Wi-Fi mode to station
  WiFi.begin(ssid, password);

  printf("Connecting to Wi-Fi network: %s\n", ssid);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP()); // Prints the assigned local IP

  Serial.println("Hello, world!");

  // Enter your setup code here, to run once:
  // NOTE: A.K.A THE IMPORTANT STUFF
  Wire.begin(21,22); // Initialize I2C communication

  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) { // Initialize the OLED display
    Serial.println(F("SSD1306 allocation failed"));
    for (;;); // Don't proceed, loop forever
  }

  display.clearDisplay(); // Clear the display buffer

  display.setTextSize(1); // Set text size to 1
  display.setTextColor(WHITE); // Set text color to white
  display.setCursor(0, 0); // Set cursor to top-left corner
  display.println(F("NEERGUARD Initialized Successfully!")); // Print message to display
  display.display(); // Update the display with the new content

  delay(2000); // Wait for 2 seconds to allow the user to read the message

  display.clearDisplay(); // Clear the display buffer again
  display.setCursor(0, 0); // Reset cursor to top-left corner
  display.printf("NEERGUARD");
  display.display(); // Update the display with the new content
  
  Serial.println("NEERGUARD Initialized Successfully!");
}

void loop() {
  // put your main code here, to run repeatedly:
  
  // NOTE: ONLY THE STUFFS THAT ARE IMPORTANT AND NECESSARY FOR THE PROGRAM TO RUN SHOULD BE HERE
  // WARNING: DO NOT PUT ANYTHING THAT IS NOT IMPORTANT OR NECESSARY FOR THE PROGRAM TO RUN IN THE LOOP FUNCTION, OTHERWISE IT WILL AFFECT THE PERFORMANCE OF THE PROGRAM AND MAY CAUSE ERRORS OR CRASHES

  int rawADC  = analogRead(TURBIDITY_SENSOR_PIN); // Read the turbidity sensor value
  float TBpinVoltage = rawADC * (3.3 / ADC_RESOLUTION); // Convert the ADC value to voltage

  float sensorVoltage = TBpinVoltage * 1.5; // Calculate the sensor voltage based on the pin voltage

  // printf("Turbidity Sensor Value: %.2f V\n", sensorVoltage); // Print the sensor voltage to the serial monitor
  // printf("Turbidity Sensor ADC Value: %d\n", rawADC); // Print the raw ADC value to the serial monitor
  // printf("Turbidity Sensor Pin Voltage: %.2f V\n", TBpinVoltage); // Print the pin voltage to the serial monitor

  float clearWaterVoltageThreshold = 4.75;

  float turbidityNTU = 0.0f;
  
  int result = NTUcalculator(sensorVoltage, turbidityNTU, clearWaterVoltageThreshold);

  Serial.print("Raw ADC: ");
  Serial.print(rawADC);
  Serial.print(" | Sensor Volt: ");
  Serial.print(sensorVoltage, 2);
  Serial.print("V | Turbidity: ");
  Serial.print(turbidityNTU, 1);
  Serial.println(" NTU");
  delay(1000); // Delay for 1 second before the next reading
}

// put function definitions here:
// Example: int myFunction(int x, int y) {
//   return x + y;
// }

int NTUcalculator(float sensorVoltage, float &turbidityNTU, float clearWaterVoltageThreshold) {
if (sensorVoltage >= clearWaterVoltageThreshold) {
    // Anything equal to or higher than your default baseline is completely clear water
    return turbidityNTU = 0.0f;
  } else if (sensorVoltage < 2.5f) {
    // If you block the sensor (like with the cloth) and it drops near 0V
    return turbidityNTU = 3000.0f; 
  } else {
     // --- INSERTED NEW CALIBRATION LOGIC HERE ---
    // Safely maps your specific hardware range from 0 to 3000 NTU
    float range = 4.89 - 2.50; 
    float actualDrop = 4.89 - sensorVoltage;
    turbidityNTU = (actualDrop / range) * 3000.0;
  }
  return 0;
};
