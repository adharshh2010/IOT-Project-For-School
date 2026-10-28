import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DataSnapshot, Parameter } from '@/src/data/types';
import { MeasurementTile } from './MeasurementTile';

const allParameters: Parameter[] = ['ph', 'turbidity', 'tds', 'temperature'];

export function MeasurementGrid({ snapshot }: { snapshot: DataSnapshot | null }) {
  const parameters = snapshot?.device.supportedParameters ?? allParameters;
  return (
    <View style={styles.grid}>
      {parameters.map((parameter) => (
        <View key={parameter} style={styles.item}>
          <MeasurementTile parameter={parameter} measurement={snapshot?.latest?.measurements[parameter]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { width: '48.5%', flexGrow: 1, flexBasis: '47%' },
});
