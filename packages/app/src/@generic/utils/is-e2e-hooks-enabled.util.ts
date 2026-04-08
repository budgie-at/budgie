import Constants from 'expo-constants';

export const isE2EHooksEnabled = () => Constants.expoConfig?.extra?.e2eHooksEnabled === true;
