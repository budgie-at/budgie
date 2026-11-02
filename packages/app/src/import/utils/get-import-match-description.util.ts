import { msg } from '@lingui/core/macro';

import { isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { ImportColumnMapFormValues } from '@budgie/import-export';
import type { useLingui } from '@lingui/react/macro';

export const getImportMatchDescription = (
    namedColumns: ImportColumnMapFormValues,
    sampleColumns: Partial<ImportColumnMapFormValues>,
    t: ReturnType<typeof useLingui>['t'],
    locale: string
): string => {
    const sampleFields = [
        { header: sampleColumns.operatedAt, label: msg`Date`, continuation: msg`date` },
        { header: sampleColumns.toAmount, label: msg`Amount`, continuation: msg`amount` },
        { header: sampleColumns.toCurrency, label: msg`Currency`, continuation: msg`currency` }
    ].filter(({ header }) => isNotEmptyString(header));
    const hasNameMatches = Object.values(namedColumns).some(isNotEmptyString);

    if (isEmptyArray(sampleFields)) {
        return hasNameMatches ? t(msg`Matched by column name`) : '';
    }

    if (hasNameMatches) {
        return t(msg`Matched by column name and sample values`);
    }

    const fields = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
        sampleFields.map(({ label, continuation }, index) => t(index === 0 ? label : continuation))
    );

    return t(msg`${fields} matched from sample values`);
};
