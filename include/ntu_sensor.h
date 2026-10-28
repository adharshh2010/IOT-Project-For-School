
#ifndef NTU_SENSOR_H
#define NTU_SENSOR_H

#include <Arduino.h>

const int TURBIDITY_SENSOR_PIN = 34;
const int ADC_RESOLUTION = 4095;

void readTurbiditySensor(float &turbidityNTU,
                          float clearWaterVoltageThreshold) {
    float volt = 0.0f;

    // Take 800 readings and calculate average voltage
    for (int i = 0; i < 800; i++) {
        volt += ((float)analogRead(TURBIDITY_SENSOR_PIN)
                 / ADC_RESOLUTION) * 3.3f;
        delay(1);
    }

    volt = volt / 800.0f;

    // Calculate actual sensor voltage
    float sensorVoltage = volt * 1.5f;

    // Clear water: sensor voltage from 0.1 V to 0.3 V
    if (sensorVoltage >= 0.1f && sensorVoltage <= 0.3f) {
        turbidityNTU = 0.0f;
        return;
    }

    // Convert voltage to NTU
    turbidityNTU = -1120.4f * sensorVoltage * sensorVoltage
                   + 5742.3f * sensorVoltage
                   - 4352.9f;

    // Set maximum turbidity to 3000 NTU
    if (sensorVoltage < 2.5f) {
        turbidityNTU = 3000.0f;
    }

    // Prevent negative NTU values
    if (turbidityNTU < 0.0f) {
        turbidityNTU = 0.0f;
    }

    // Apply the configured clear-water threshold
    if (sensorVoltage >= clearWaterVoltageThreshold) {
        turbidityNTU = 0.0f;
    }
    
}

#endif // NTU_SENSOR_H
