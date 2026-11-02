import { msg, plural } from '@lingui/core/macro';

import type { useLingui } from '@lingui/react/macro';

export const getImportRequiredFooter = (missingCount: number, t: ReturnType<typeof useLingui>['t']): string => {
    if (missingCount === 0) {
        return t(msg`All required fields matched. Tap a field to change it.`);
    }

    if (missingCount === 5) {
        return t(msg`Pick a column for each field.`);
    }

    return t({
        message: plural(missingCount, { one: '# required field still needs a column', other: '# required fields still need a column' })
    });
};
