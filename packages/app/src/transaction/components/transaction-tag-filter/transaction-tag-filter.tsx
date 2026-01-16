import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { TagsSelectorBottomSheet } from '../../../tag/components/tags-selector-bottom-sheet/tags-selector-bottom-sheet';
import { toggleFilterSelection } from '../../utils/toggle-filter-selection.util';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionTagFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const selectedTagsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTagsCount) ? t`Tags (${selectedTagsCount})` : t`Tags`;

    const handleOpen = () => void ref.current?.open();

    const handleSelect = (tagId: number) => {
        onChange(toggleFilterSelection(value, [tagId]));
    };

    const handleClear = () => void onChange(null);

    return (
        <>
            <TransactionFilterChip
                isActive={isPositiveNumber(selectedTagsCount)}
                icon={UserIconNameEnum.Hash}
                label={label}
                onPress={handleOpen}
            />

            <TagsSelectorBottomSheet ref={ref} selectedTagIds={value ?? []} onSelect={handleSelect} onClear={handleClear} />
        </>
    );
};
