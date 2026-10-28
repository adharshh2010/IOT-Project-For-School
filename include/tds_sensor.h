
#ifndef TDS_SENSOR_H
#define TDS_SENSOR_H

#include <Arduino.h>

#ifndef TDS_SENSOR_PIN
#define TDS_SENSOR_PIN 35
#endif

#ifndef TDS_ADC_RESOLUTION
#define TDS_ADC_RESOLUTION 4095.0f
#endif

#ifndef TDS_ADC_REFERENCE_VOLTAGE
#define TDS_ADC_REFERENCE_VOLTAGE 3.3f
#endif

inline void readTDSSensor(float &tdsPPM,
                          float waterTemperatureC = 25.0f) {
    const int sampleCount = 31;
    int readings[sampleCount];

    // Collect ADC readings
    for (int i = 0; i < sampleCount; i++) {
        readings[i] = analogRead(TDS_SENSOR_PIN);
        delay(5);
    }

    // Sort readings for median filtering
    for (int i = 0; i < sampleCount - 1; i++) {
        for (int j = 0; j < sampleCount - i - 1; j++) {
            if (readings[j] > readings[j + 1]) {
                int temp = readings[j];
                readings[j] = readings[j + 1];
                readings[j + 1] = temp;
            }
        }
    }

    float medianADC = readings[sampleCount / 2];

    // Convert ADC reading to voltage
    float voltage = (medianADC / TDS_ADC_RESOLUTION)
                    * TDS_ADC_REFERENCE_VOLTAGE;

    // Temperature compensation
    float coefficient =
        1.0f + 0.02f * (waterTemperatureC - 25.0f);

    if (coefficient < 0.1f) {
        coefficient = 0.1f;
    }

    float compensatedVoltage = voltage / coefficient;

    // DFRobot-style TDS polynomial
    float tds =
        (133.42f * compensatedVoltage
                   * compensatedVoltage
                   * compensatedVoltage
         - 255.86f * compensatedVoltage
                     * compensatedVoltage
         + 857.39f * compensatedVoltage) * 0.5f;

    if (tds < 0.0f) {
        tds = 0.0f;
    }

    tdsPPM = tds;

    // Debug output
    Serial.print("ADC: ");
    Serial.print(medianADC, 0);
    Serial.print(" | Voltage: ");
    Serial.print(voltage, 3);
    Serial.print(" V | TDS: ");
    Serial.print(tdsPPM, 1);
    Serial.println(" ppm");
}

#endif // TDS_SENSOR_H
