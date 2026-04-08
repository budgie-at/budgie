import { Settings } from 'react-native';

export const getE2ESettingsValue = (key: string): unknown => Settings.get(key);
