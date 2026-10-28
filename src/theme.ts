import { useColorScheme } from 'react-native';

const light = {
  background: '#F4F7F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF1F1',
  text: '#102A31',
  secondaryText: '#526A70',
  mutedText: '#71868B',
  border: '#DCE6E7',
  primary: '#087E83',
  primaryDark: '#075D63',
  primarySoft: '#DDF3F1',
  warning: '#A75A09',
  warningSoft: '#FFF1D8',
  danger: '#B43C3C',
  dangerSoft: '#FDE9E7',
  success: '#25714E',
  successSoft: '#E1F3E9',
  chart: '#07868A',
  chartGrid: '#DCE6E7',
  overlay: '#EAF1F1',
};

const dark: typeof light = {
  background: '#0D191D',
  surface: '#15252A',
  surfaceMuted: '#1C3035',
  text: '#E6F0F0',
  secondaryText: '#B1C4C7',
  mutedText: '#82999D',
  border: '#2A4045',
  primary: '#61CECC',
  primaryDark: '#85DEDC',
  primarySoft: '#183B3D',
  warning: '#F1B95E',
  warningSoft: '#392D1D',
  danger: '#F48D88',
  dangerSoft: '#3D2526',
  success: '#72D5A1',
  successSoft: '#1D382C',
  chart: '#61CECC',
  chartGrid: '#2A4045',
  overlay: '#1C3035',
};

export type AppPalette = typeof light;

export function useAppTheme(): AppPalette {
  return useColorScheme() === 'dark' ? dark : light;
}
