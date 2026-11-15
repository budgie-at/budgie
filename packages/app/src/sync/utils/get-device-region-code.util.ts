import { getLocales } from 'expo-localization';

export const getDeviceRegionCode = (): string | null => getLocales().at(0)?.regionCode?.toUpperCase() ?? null;
