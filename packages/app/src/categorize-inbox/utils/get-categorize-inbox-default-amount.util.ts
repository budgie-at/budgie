import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';
import type { InstrumentEntityInterface } from '@budgie/contracts';

export const getCategorizeInboxDefaultAmount = (
    rows: readonly CategorizeInboxRowInterface[],
    defaultInstrument: Pick<InstrumentEntityInterface, 'id' | 'symbol'>
): number | null => {
    const amounts = rows
        .map(row => {
            if (row.baseInstrumentId === defaultInstrument.id && isDefined(row.baseAmount)) {
                return row.baseAmount;
            }

            return row.instrumentSymbol === defaultInstrument.symbol ? row.amount : null;
        })
        .filter(isDefined);

    return isNotEmptyArray(amounts) ? amounts.reduce((total, amount) => total + amount, 0) : null;
};
