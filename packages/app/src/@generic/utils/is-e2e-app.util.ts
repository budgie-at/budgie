import Constants from 'expo-constants';

const appVariantKey = 'appVariant';

export const isE2eApp = () => Constants.expoConfig?.extra?.[appVariantKey] === 'e2e' || Constants.expoConfig?.name === 'budgie (E2E)';
