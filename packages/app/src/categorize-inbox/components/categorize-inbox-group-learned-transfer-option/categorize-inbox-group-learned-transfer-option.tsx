import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER } from '../../constant/categorize-inbox-transfer-account-filter.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';
import { getCategorizeInboxTransferKey } from '../../utils/get-categorize-inbox-transfer-key.util';
import { CategorizeInboxLeadOption } from '../categorize-inbox-lead-option/categorize-inbox-lead-option';
import { CategorizeInboxTonalCapsule } from '../categorize-inbox-tonal-capsule/categorize-inbox-tonal-capsule';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupLearnedTransferOption = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { learnedTransferAccountIds, transferCluster } = useCategorizeInboxContext();
    const { accounts } = useSearchAccountsSortedQuery('', CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER);

    const learnedAccountId = learnedTransferAccountIds.get(getCategorizeInboxTransferKey(cluster.displayTitle));
    const account = accounts.find(candidate => candidate.id === learnedAccountId);

    const handlePress = (): void => {
        if (isDefined(account)) {
            transferCluster(cluster, account.id, account.title, true);
            router.dismissTo('/categorize');
        }
    };

    if (!isDefined(account)) {
        return null;
    }

    const { title } = account;

    return (
        <CategorizeInboxLeadOption
            icon={UserIconNameEnum.ArrowLeftRight}
            title={t`Transfer to ${title}`}
            subtitle={t`Suggested`}
            variant="positive"
            accessory={<CategorizeInboxTonalCapsule label={t`Transfer`} variant={CategorizeInboxTonalCapsuleVariantEnum.POSITIVE} />}
            onPress={handlePress}
        />
    );
};
