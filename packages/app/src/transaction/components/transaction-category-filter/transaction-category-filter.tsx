import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CategoriesSelectorBottomSheet } from '../../../category/components/categories-selector-bottom-sheet/categories-selector-bottom-sheet';
import { toggleFilterSelection } from '../../utils/toggle-filter-selection.util';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionCategoryFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const selectedCategoriesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedCategoriesCount) ? t`Categories (${selectedCategoriesCount})` : t`Categories`;

    const handleOpen = () => void ref.current?.open();

    const handleSelect = (categoryId: number) => {
        onChange(toggleFilterSelection(value, [categoryId]));
    };

    const handleClear = () => void onChange(null);

    return (
        <>
            <TransactionFilterChip
                isActive={isPositiveNumber(selectedCategoriesCount)}
                icon={UserIconNameEnum.Tag}
                label={label}
                onPress={handleOpen}
            />

            <CategoriesSelectorBottomSheet ref={ref} selectedCategoryIds={value ?? []} onSelect={handleSelect} onClear={handleClear} />
        </>
    );
};
