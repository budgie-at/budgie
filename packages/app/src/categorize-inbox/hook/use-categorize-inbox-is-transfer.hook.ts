import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../context/categorize-inbox.context';
import { getCategorizeInboxJarName } from '../utils/get-categorize-inbox-jar-name.util';
import { getCategorizeInboxTransferKey } from '../utils/get-categorize-inbox-transfer-key.util';

import { useCategorizeInboxMatchedAccount } from './use-categorize-inbox-matched-account.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const useCategorizeInboxIsTransfer = (cluster: Pick<CategorizeInboxClusterInterface, 'displayTitle'>): boolean => {
    const { learnedTransferAccountIds } = useCategorizeInboxContext();
    const matchedAccount = useCategorizeInboxMatchedAccount(cluster);

    return (
        isDefined(matchedAccount) ||
        isDefined(getCategorizeInboxJarName(cluster.displayTitle)) ||
        learnedTransferAccountIds.has(getCategorizeInboxTransferKey(cluster.displayTitle))
    );
};
