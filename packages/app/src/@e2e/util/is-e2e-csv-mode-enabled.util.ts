import { isE2EHooksEnabled } from '../../@generic/utils/is-e2e-hooks-enabled.util';

import { getE2ESettingsValue } from './get-e2e-settings-value.util';
import { parseE2EBooleanValue } from './parse-e2e-boolean-value.util';

export const isE2ECsvModeEnabled = () => isE2EHooksEnabled() || parseE2EBooleanValue(getE2ESettingsValue('e2eUseCsvFixture'));
