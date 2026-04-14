import Constants from 'expo-constants';

// eslint-disable-next-line dot-notation
const isAiForcedDisabled = process.env['EXPO_PUBLIC_AI_DISABLE'] === 'true';

// eslint-disable-next-line dot-notation
export const isAiEnabled = () => Constants.expoConfig?.extra?.['aiEnabled'] === true && !isAiForcedDisabled;
