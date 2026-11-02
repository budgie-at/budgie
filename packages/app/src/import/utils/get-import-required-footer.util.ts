import { msg } from '@lingui/core/macro';

import type { useLingui } from '@lingui/react/macro';

export const getImportRequiredFooter = (missingCount: number, t: ReturnType<typeof useLingui>['t']): string | null => {
    if (missingCount === 0) {
        return t(msg`All required fields matched. Tap a field to change it.`);
    }

    if (missingCount === 5) {
        return t(msg`Pick a column for each field.`);
    }

    return null;
};
