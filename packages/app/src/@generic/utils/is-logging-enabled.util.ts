import Constants from 'expo-constants';

export const isLoggingEnabled = () => __DEV__ || Constants.expoConfig?.extra?.['loggingEnabled'] === true;
