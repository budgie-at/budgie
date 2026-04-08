import Constants from 'expo-constants';

const isAiForcedDisabled = process.env.EXPO_PUBLIC_AI_DISABLE === 'true';

export const isAiEnabled = () => Constants.expoConfig?.extra?.aiEnabled === true && !isAiForcedDisabled;
