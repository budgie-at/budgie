import Constants from 'expo-constants';

export const isAiEnabled = () => Constants.expoConfig?.extra?.['aiEnabled'] === true;
