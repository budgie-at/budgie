import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useTransactionTypeFilterModal } from '../../context/transaction-type-filter-modal.context';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

interface Props {
    readonly value: TransactionTypeEnum[] | null;
    readonly onChange: (value: TransactionTypeEnum[] | null) => void;
}

export const TransactionTypeFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const [openTransactionTypeFilter] = useTransactionTypeFilterModal();

    const handleOpen = async () => {
        const result = await openTransactionTypeFilter({ value });

        if (isDefined(result)) {
            onChange(result.value);
        }
    };

    const selectedTypesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTypesCount) ? t`Type (${selectedTypesCount})` : t`Type`;

    return (
        <TransactionFilterChip
            isActive={isPositiveNumber(selectedTypesCount)}
            icon={UserIconNameEnum.Layers}
            label={label}
            onPress={handleOpen}
        />
    );
};
