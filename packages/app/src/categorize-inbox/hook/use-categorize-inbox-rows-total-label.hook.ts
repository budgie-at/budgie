import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { getCategorizeInboxDefaultAmount } from '../utils/get-categorize-inbox-default-amount.util';

import { useCategorizeInboxAmountLabel } from './use-categorize-inbox-amount-label.hook';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

export const useCategorizeInboxRowsTotalLabel = (rows: readonly CategorizeInboxRowInterface[]): string | null => {
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const total = getCategorizeInboxDefaultAmount(rows, defaultInstrument);

    return isDefined(total) ? amountLabel(total, defaultInstrument.symbol) : null;
};
