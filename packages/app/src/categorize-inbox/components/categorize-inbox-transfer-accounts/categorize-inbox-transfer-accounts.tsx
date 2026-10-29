import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER } from '../../constant/categorize-inbox-transfer-account-filter.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { isCategorizeInboxAccountNameMatch } from '../../utils/is-categorize-inbox-account-name-match.util';
import { CategorizeInboxTransferAccountSection } from '../categorize-inbox-transfer-account-section/categorize-inbox-transfer-account-section';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly search: string;
    readonly isRuleEnabled: boolean;
}

export const CategorizeInboxTransferAccounts = ({ cluster, search, isRuleEnabled }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { transferCluster } = useCategorizeInboxContext();
    const { accounts } = useSearchAccountsSortedQuery(search, CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER);

    const handleSelect = (account: AccountWithInstrumentEntityInterface): void => {
        transferCluster(cluster, account.id, account.title, isRuleEnabled);
        router.dismissTo('/categorize');
    };

    const matches = accounts.filter(account => isCategorizeInboxAccountNameMatch(account.title, cluster.displayTitle));
    const others = accounts.filter(account => !matches.includes(account));
    const hasMatches = isNotEmptyArray(matches);
    const othersTitle = hasMatches ? t`Other accounts` : t`Your accounts`;
    const matchesSection = hasMatches ? (
        <CategorizeInboxTransferAccountSection title={t`Name matches`} accounts={matches} onSelect={handleSelect} />
    ) : null;

    return (
        <>
            {matchesSection}
            <CategorizeInboxTransferAccountSection title={othersTitle} accounts={others} onSelect={handleSelect} />
        </>
    );
};
