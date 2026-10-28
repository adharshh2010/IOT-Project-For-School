#ifndef DISPLAY_H
#define DISPLAY_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET    -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

// static avoids multiple-definition linker errors when this header is included
// by more than one source file.
static Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
static bool displayInitialized = false;

inline bool setupDisplay() {
  if (displayInitialized) {
    return true;
  }

  Serial.println(F("Initializing OLED display..."));
  Wire.begin(21, 22); // ESP32 SDA and SCL pins

  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    return false;
  }

  displayInitialized = true;
  display.clearDisplay();
  display.display();
  return true;
}

inline bool displayReady() {
  return displayInitialized;
}

inline void displayClear() {
  if (!displayInitialized) {
    return;
  }
    display.clearDisplay(); // Clear the display buffer
    display.display(); // Update the display with the cleared buffer
}

inline void displayPrint(const char* message) {
  if (!displayInitialized) {
    return;
  }
  if (message == nullptr) {
    message = "";
  }
    display.clearDisplay(); // Clear the display buffer
    display.setTextSize(1); // Set text size to 1
    display.setTextColor(WHITE); // Set text color to white
    display.setCursor(0, 0); // Set cursor to top-left corner
    display.println(message); // Print message to display
    display.display(); // Update the display with the new content
}

  // Draw text without clearing existing content.
  inline void displayText(const char* message, int16_t x, int16_t y,
              uint8_t textSize = 1) {
    if (!displayInitialized || message == nullptr) {
      return;
    }
    display.setTextSize(textSize);
    display.setTextColor(WHITE);
    display.setCursor(x, y);
    display.print(message);
    display.display();
  }

  inline void displaySetContrast(uint8_t contrast) {
    if (!displayInitialized) {
      return;
    }
    display.ssd1306_command(SSD1306_SETCONTRAST);
    display.ssd1306_command(contrast);
  }

#endif // DISPLAY_H