import Constants from 'expo-constants';

export const isLoggingEnabled = (): boolean => Constants.expoConfig?.extra?.loggingEnabled === true;
