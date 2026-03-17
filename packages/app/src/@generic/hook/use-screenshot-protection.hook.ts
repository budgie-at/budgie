import { useSetting } from '../../settings/hook/use-setting.hook';

export const useScreenshotProtection = (): boolean => useSetting('isScreenshotProtectionEnabled');
