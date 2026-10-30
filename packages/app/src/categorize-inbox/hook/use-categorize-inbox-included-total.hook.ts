import { useCategorizeInboxContext } from '../context/categorize-inbox.context';

import { useCategorizeInboxRowsTotalLabel } from './use-categorize-inbox-rows-total-label.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const useCategorizeInboxIncludedTotal = (cluster: CategorizeInboxClusterInterface) => {
    const { includedRows } = useCategorizeInboxContext();

    const included = includedRows(cluster);

    return { count: included.length, totalLabel: useCategorizeInboxRowsTotalLabel(included) };
};
