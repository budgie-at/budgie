import { applicationId } from 'expo-application';
import Constants from 'expo-constants';

const appVariantKey = 'appVariant';
const e2eApplicationId = 'com.vitalyiegorov.budgie.e2e';

export const isE2eApp = () =>
    applicationId === e2eApplicationId ||
    Constants.expoConfig?.extra?.[appVariantKey] === 'e2e' ||
    Constants.expoConfig?.name === 'budgie (E2E)';
