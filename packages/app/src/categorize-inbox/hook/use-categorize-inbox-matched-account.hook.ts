import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER } from '../constant/categorize-inbox-transfer-account-filter.constant';
import { isCategorizeInboxAccountNameMatch } from '../utils/is-categorize-inbox-account-name-match.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export const useCategorizeInboxMatchedAccount = ({ displayTitle }: Pick<CategorizeInboxClusterInterface, 'displayTitle'>) => {
    const { accounts } = useSearchAccountsSortedQuery('', CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER);

    return accounts.find(account => isCategorizeInboxAccountNameMatch(account.title, displayTitle)) ?? null;
};
