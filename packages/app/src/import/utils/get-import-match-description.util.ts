import { msg } from '@lingui/core/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import type { ImportColumnMapFormValues } from '@budgie/import-export';
import type { useLingui } from '@lingui/react/macro';

export const getImportMatchDescription = (
    columns: ImportColumnMapFormValues,
    hasMatchedSamples: boolean,
    t: ReturnType<typeof useLingui>['t']
): string => {
    if (!Object.values(columns).some(isNotEmptyString)) {
        return '';
    }

    return hasMatchedSamples ? t(msg`Matched by column names and sample values`) : t(msg`Matched by column name`);
};
