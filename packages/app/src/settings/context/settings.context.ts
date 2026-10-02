import { useAtomValue } from '@effect/atom-react/Hooks';

import { settingsContextAtom } from '../constants/settings-context-atom.constant';

export const useSettingsContext = () => useAtomValue(settingsContextAtom);
