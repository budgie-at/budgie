import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../context/categorize-inbox.context';
import { getCategorizeInboxDefaultAmount } from '../utils/get-categorize-inbox-default-amount.util';

import { useCategorizeInboxAmountLabel } from './use-categorize-inbox-amount-label.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const useCategorizeInboxIncludedTotal = (cluster: CategorizeInboxClusterInterface) => {
    const { includedRows } = useCategorizeInboxContext();
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const included = includedRows(cluster);
    const total = getCategorizeInboxDefaultAmount(included, defaultInstrument);

    return { count: included.length, totalLabel: isDefined(total) ? amountLabel(total, defaultInstrument.symbol) : null };
};
