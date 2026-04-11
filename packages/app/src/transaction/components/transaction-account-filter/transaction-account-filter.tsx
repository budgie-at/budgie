import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useTransactionAccountFilterModal } from '../../context/transaction-account-filter-modal.context';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionAccountFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const [openTransactionAccountFilter] = useTransactionAccountFilterModal();

    const handleOpen = async () => {
        const result = await openTransactionAccountFilter({ value });

        if (isDefined(result)) {
            onChange(result.value);
        }
    };

    const selectedAccountsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedAccountsCount) ? t`Accounts (${selectedAccountsCount})` : t`Accounts`;
    const chipTestID = isPositiveNumber(selectedAccountsCount)
        ? TransactionFiltersSelector.AccountChipActive
        : TransactionFiltersSelector.AccountChip;

    return (
        <TransactionFilterChip
            isActive={isPositiveNumber(selectedAccountsCount)}
            icon={UserIconNameEnum.Wallet}
            label={label}
            onPress={handleOpen}
            testID={chipTestID}
        />
    );
};
