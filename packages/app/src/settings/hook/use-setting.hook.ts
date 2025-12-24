import { SettingsEntityInterface } from '@budgie/contracts';

import { useSettingsContext } from '../context/settings.context';

export const useSetting = <T extends keyof SettingsEntityInterface>(settingKey: T): SettingsEntityInterface[T] => {
    const { settings } = useSettingsContext();

    return settings[settingKey];
};
