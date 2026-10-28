#ifndef PH_SENSOR_H
#define PH_SENSOR_H

#include <Arduino.h>

#if defined(ESP8266)
  const int PH_PIN = A0;      
  const int ADC_MAX_RES = 1023; 
#elif defined(ESP32)
  const int PH_PIN = 34;      
  const int ADC_MAX_RES = 4095;
#endif

// --- CALIBRATION VARIABLES (Tweak these below) ---
// 1. The voltage value your sensor outputs when placed in pure neutral water (pH 7.0)
float phNeutralVoltageCalibration = 2.441; 

// 2. The voltage drop slope per full pH unit. Standard default value is 0.18V
float phVoltageStepSlope = 0.180;    


void setupPH() {
  #if defined(ESP32)
    analogSetAttenuation(ADC_11db); 
  #endif
  pinMode(PH_PIN, INPUT);
}

float readPH() {
  long adcSum = 0;
  const int numSamples = 30; 

  for (int i = 0; i < numSamples; i++) {
    adcSum += analogRead(PH_PIN);
    delay(5);
  }
  
  float avgADC = (float)adcSum / numSamples;
  float pinVoltage = avgADC * (3.3 / ADC_MAX_RES);
  float sensorVoltage = pinVoltage * 1.5; // Undo 10k/20k voltage divider mapping

  // Calculate the pH based on your calibration settings
  float calculatedPH = 7.0 + ((phNeutralVoltageCalibration - sensorVoltage) / phVoltageStepSlope);

  // Hard clamp output bounds to valid chemical metrics
  if (calculatedPH < 0.0)  calculatedPH = 0.0;
  if (calculatedPH > 14.0) calculatedPH = 14.0;

  // Print diagnostics alongside the final value for easy calibration tracking
  Serial.print("Raw ADC: ");
  Serial.print(avgADC, 1);
  Serial.print(" | Sensor Volt: ");
  Serial.print(sensorVoltage, 3);
  Serial.print(" V | calculated pH: ");
  Serial.println(calculatedPH, 2);

  return calculatedPH;
}

#endif
