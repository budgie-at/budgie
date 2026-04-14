import Constants from 'expo-constants';

// eslint-disable-next-line dot-notation
export const isAiEnabled = () => Constants.expoConfig?.extra?.['aiEnabled'] === true;
