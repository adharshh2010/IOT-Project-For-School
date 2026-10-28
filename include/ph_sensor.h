#ifndef PH_SENSOR_H
#define PH_SENSOR_H

#include <Arduino.h>

#ifndef PH_SENSOR_PIN
#define PH_SENSOR_PIN 32
#endif

const int PH_PIN = PH_SENSOR_PIN;
const int ADC_MAX_RES = 4095; // Maximum ADC resolution for ESP32

// --- CALIBRATION VARIABLES (Tweak these below) ---
// 1. The voltage value your sensor outputs when placed in pure neutral water (pH 7.0)
float phNeutralVoltageCalibration = 2.441; 

// 2. The voltage drop slope per full pH unit. Standard default value is 0.18V
float phVoltageStepSlope = 0.180;    

void setupPH() {
    analogSetAttenuation(ADC_11db); 
    pinMode(PH_PIN, INPUT);
}

float readPH() {
  long adcSum = 0;
  long voltageSum = 0;
  const int numSamples = 1000; 

  for (int i = 0; i < numSamples; i++) {
    adcSum += analogRead(PH_PIN);
    voltageSum += analogReadMilliVolts(PH_PIN);
    delay(5);
  }
  
  float avgADC = (float)adcSum / numSamples;
  // Use the ESP32's calibrated ADC conversion instead of assuming 3.3 V /
  // 4095. The latter can produce a large error, especially with 11 dB input.
  float pinVoltage = ((float)voltageSum / numSamples) / 1000.0;
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
  Serial.print(" V | Neutral Volt: ");
  Serial.print(phNeutralVoltageCalibration, 3);
  Serial.print(" V | calculated pH: ");
  Serial.println(calculatedPH, 2);

  if (sensorVoltage > phNeutralVoltageCalibration + (7.0 * phVoltageStepSlope) ||
      sensorVoltage < phNeutralVoltageCalibration - (7.0 * phVoltageStepSlope)) {
    Serial.println("Warning: sensor voltage is outside the configured pH calibration range; adjust phNeutralVoltageCalibration or phVoltageStepSlope.");
  }

  return calculatedPH;
}

#endif