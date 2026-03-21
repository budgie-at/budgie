import { AppState } from 'react-native';

export const isAppActive = (): boolean => AppState.currentState === 'active';
