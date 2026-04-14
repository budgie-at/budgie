import Constants from 'expo-constants';

// eslint-disable-next-line dot-notation
export const isE2EHooksEnabled = () => Constants.expoConfig?.extra?.['e2eHooksEnabled'] === true;
