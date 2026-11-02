import { msg } from '@lingui/core/macro';

import { isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { ImportColumnMapFormValues } from '@budgie/import-export';
import type { useLingui } from '@lingui/react/macro';

export const getImportMatchDescription = (
    namedColumns: ImportColumnMapFormValues,
    sampleColumns: Partial<ImportColumnMapFormValues>,
    t: ReturnType<typeof useLingui>['t']
): string => {
    const sampleFields = [
        { header: sampleColumns.operatedAt, label: msg`Date`, continuation: msg`date` },
        { header: sampleColumns.toAmount, label: msg`Amount`, continuation: msg`amount` },
        { header: sampleColumns.toCurrency, label: msg`Currency`, continuation: msg`currency` }
    ].filter(({ header }) => isNotEmptyString(header));
    const hasNameMatches = Object.values(namedColumns).some(isNotEmptyString);

    if (isEmptyArray(sampleFields)) {
        return hasNameMatches ? t(msg`Matched by column name.`) : '';
    }

    if (hasNameMatches) {
        return t(msg`Matched by column name and sample values.`);
    }

    const [first, second, third] = sampleFields.map(({ label, continuation }, index) => t(index === 0 ? label : continuation));

    if (isNotEmptyString(third)) {
        return t(msg`${first}, ${second} and ${third} matched from sample values.`);
    }

    if (isNotEmptyString(second)) {
        return t(msg`${first} and ${second} matched from sample values.`);
    }

    return t(msg`${first} matched from sample values.`);
};
