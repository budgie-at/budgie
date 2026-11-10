import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

interface Props {
    readonly value: TransactionTypeEnum[] | null;
    readonly onChange: (value: TransactionTypeEnum[] | null) => void;
}

export const TransactionTypeFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const openTransactionTypeFilter = useOpenModal('/transaction-type-filter');

    const handleOpen = () => {
        openTransactionTypeFilter({ value }, result => {
            if (isDefined(result)) {
                onChange(result.value);
            }
        });
    };

    const selectedTypesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTypesCount) ? t`Type (${selectedTypesCount})` : t`Type`;

    return (
        <TransactionFilterChip
            isActive={isPositiveNumber(selectedTypesCount)}
            label={label}
            onPress={handleOpen}
            testID={TransactionFiltersSelector.TypeChip}
        />
    );
};
