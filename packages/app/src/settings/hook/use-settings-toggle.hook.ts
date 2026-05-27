import { SettingsEntityInterface } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { updateSettingsMutation } from '../mutation/update-settings.mutation';

import { useSetting } from './use-setting.hook';

interface UseSettingsToggleOptionsInterface<TKey extends BooleanSettingKey> {
    readonly settingKey: TKey;
    readonly errorTitle: string;
}

type BooleanSettingKey = {
    [K in keyof SettingsEntityInterface]: SettingsEntityInterface[K] extends boolean ? K : never;
}[keyof SettingsEntityInterface];

interface UseSettingsToggleResultInterface {
    readonly value: boolean;
    readonly persist: (next: boolean) => Promise<void>;
}

export const useSettingsToggle = <TKey extends BooleanSettingKey>({
    settingKey,
    errorTitle
}: UseSettingsToggleOptionsInterface<TKey>): UseSettingsToggleResultInterface => {
    const value = useSetting(settingKey);
    const logger = getLogger(`useSettingsToggle:${settingKey}`);

    const persist = async (next: boolean): Promise<void> => {
        try {
            await updateSettingsMutation({ [settingKey]: next });
        } catch (error: unknown) {
            logger.error('toggle-failed', { errorMessage: getErrorMessage(error) });
            Toast.show({ type: 'error', text1: errorTitle, text2: getErrorMessage(error) });
        }
    };

    return { value, persist };
};
