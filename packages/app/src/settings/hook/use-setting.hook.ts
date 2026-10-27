import { SettingsEntityInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { settingsAtom } from '../constants/settings-atoms.constant';

export const useSetting = <T extends keyof SettingsEntityInterface>(settingKey: T): SettingsEntityInterface[T] =>
    useAtomValue(settingsAtom, settings => settings[settingKey]);
