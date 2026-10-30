import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isEmptyArray } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxActionCapsule } from '../categorize-inbox-action-capsule/categorize-inbox-action-capsule';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupMoveToCashOption = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { includedRows, moveToCash, cashWithdrawalTransactionIds } = useCategorizeInboxContext();

    const transactionIds = includedRows(cluster)
        .map(row => row.transactionId)
        .filter(transactionId => cashWithdrawalTransactionIds.has(transactionId));

    const handlePress = (): void => {
        moveToCash(transactionIds);
        router.dismissTo('/categorize');
    };

    if (isEmptyArray(transactionIds)) {
        return null;
    }

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.Banknote}
            title={t`Move to cash`}
            subtitle={t`Becomes a transfer to your cash wallet`}
            accessory={<CategorizeInboxActionCapsule label={t`Move`} variant="outline" />}
            onPress={handlePress}
        />
    );
};
