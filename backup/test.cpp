#include <Arduino.h>
#include <Wire.h> 
#include <WiFi.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include "display.h"


// put function declarations here:
// Example: int myFunction(int, int);

// put global variables and definitions here:


const char* ssid = "AirFiber-Ihooc8-gk"; // Replace with your network SSID
const char* password = "Gktraders@rajithagopakumar"; // Replace with your network password



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
  
  setupDisplay(); // Initialize the OLED display

  displayClear(); // Clear the display buffer

  displayPrint("NEERGUARD Initialized Successfully!"); // Print the message to the display

  delay(2000); // Wait for 2 seconds to allow the user to read the message

  displayClear(); // Clear the display buffer again
  
  displayPrint("NEERGUARD"); // Print the message to the display
  
  Serial.println("NEERGUARD Initialized Successfully!");
}

void loop() {
  // put your main code here, to run repeatedly:
  
  // NOTE: ONLY THE STUFFS THAT ARE IMPORTANT AND NECESSARY FOR THE PROGRAM TO RUN SHOULD BE HERE
  // WARNING: DO NOT PUT ANYTHING THAT IS NOT IMPORTANT OR NECESSARY FOR THE PROGRAM TO RUN IN THE LOOP FUNCTION, OTHERWISE IT WILL AFFECT THE PERFORMANCE OF THE PROGRAM AND MAY CAUSE ERRORS OR CRASHES

}

// put function definitions here:
// Example: int myFunction(int x, int y) {
//   return x + y;
// }


