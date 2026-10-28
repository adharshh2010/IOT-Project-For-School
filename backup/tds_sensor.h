#ifndef TDS_SENSOR_H
#define TDS_SENSOR_H

#include <Arduino.h>

#if defined(ESP8266)
  const int TDS_PIN = A0;      
  const float TDS_ADC_MAX = 1023.0; 
  const float VREF = 3.3;
#elif defined(ESP32)
  const int TDS_PIN = 34;       // Ensure this matches your physical wiring pin
  const float TDS_ADC_MAX = 4095.0;
  const float VREF = 3.3;         // ESP32 reference voltage
#endif

void setupTDS() {
  #if defined(ESP32)
    analogSetAttenuation(ADC_11db); // Sets ESP32 ADC input range to 0 ~ 3.3V
  #endif
  pinMode(TDS_PIN, INPUT);
}

float readTDS() {
  long adcSum = 0;
  const int numSamples = 30; 

  // Smooth out electrical noise using multiple samples
  for (int i = 0; i < numSamples; i++) {
    adcSum += analogRead(TDS_PIN);
    delay(5);
  }
  
  float avgADC = (float)adcSum / numSamples;
  
  // Convert ADC reading to actual voltage
  float sensorVoltage = avgADC * (VREF / TDS_ADC_MAX);

  // Check for sensor saturation in heavy salt water / high TDS solutions (> 2.3V)
  bool isSaturated = false;
  if (sensorVoltage > 2.3) {
    isSaturated = true;
    sensorVoltage = 2.3; // Cap voltage to prevent breaking the calibration curve
  }

  // Temperature compensation formula (assumes 25°C baseline)
  float temperature = 25.0; 
  float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
  float compensatedVoltage = sensorVoltage / compensationCoefficient;

  // Convert voltage to TDS value in ppm using the standard cubic calibration curve
  float calculatedTDS = (133.42 * compensatedVoltage * compensatedVoltage * compensatedVoltage 
                        - 255.86 * compensatedVoltage * compensatedVoltage 
                        + 857.39 * compensatedVoltage) * 0.5;

  // Hard floor safety limit
  if (calculatedTDS < 0.0) calculatedTDS = 0.0;

  // Print diagnostic values to Serial Monitor
  Serial.print("Raw ADC: ");
  Serial.print(avgADC, 1);
  Serial.print(" | Sensor Volt: ");
  Serial.print(sensorVoltage, 3);
  Serial.print(" V | Calculated TDS: ");
  if (isSaturated) {
    Serial.print("~1000+ ppm (MAX / Saturated)");
  } else {
    Serial.print(calculatedTDS, 1);
    Serial.print(" ppm");
  }
  Serial.println();

  return calculatedTDS;
}

#endif