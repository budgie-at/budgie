import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../../../@e2e/selectors/transaction-filters.selector';
import { useTransactionCategoryFilterModal } from '../../context/transaction-category-filter-modal.context';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionCategoryFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const [openTransactionCategoryFilter] = useTransactionCategoryFilterModal();

    const handleOpen = async () => {
        const result = await openTransactionCategoryFilter({ value });

        if (isDefined(result)) {
            onChange(result.value);
        }
    };

    const selectedCategoriesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedCategoriesCount) ? t`Categories (${selectedCategoriesCount})` : t`Categories`;

    return (
        <TransactionFilterChip
            isActive={isPositiveNumber(selectedCategoriesCount)}
            icon={UserIconNameEnum.Tag}
            label={label}
            onPress={handleOpen}
            testID={TransactionFiltersSelectors.CategoryChip}
        />
    );
};
