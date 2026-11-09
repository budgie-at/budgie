import { CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useAttachDebtSelector } from '../../../account/hook/use-attach-debt-selector.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupAttachDebtOption = ({ cluster }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { strategy, includedRows, attachDebt } = useCategorizeInboxContext();
    const openAttachDebtSelector = useAttachDebtSelector();

    const rows = includedRows(cluster);
    const firstRow = rows.at(0);
    if (
        !isDefined(firstRow) ||
        strategy?.labelKind !== CategorizeInboxLabelKindEnum.CATEGORY ||
        (firstRow.type !== TransactionTypeEnum.INCOME && firstRow.type !== TransactionTypeEnum.EXPENSE) ||
        rows.some(row => row.type !== firstRow.type)
    ) {
        return null;
    }

    const transactionIds = rows.map(row => row.transactionId);
    const borrowedIncome =
        rows.length === 1 && firstRow.type === TransactionTypeEnum.INCOME
            ? {
                  transactionId: firstRow.transactionId,
                  title: firstRow.title,
                  amount: firstRow.amount,
                  instrumentSymbol: firstRow.instrumentSymbol
              }
            : null;

    const handlePress = (): void =>
        void openAttachDebtSelector(borrowedIncome, null, debtAccountId => {
            attachDebt(transactionIds, debtAccountId);
            router.dismissTo('/categorize');
        });

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.HandCoins}
            title={t`Attach debt`}
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
