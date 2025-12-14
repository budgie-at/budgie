import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { TransactionBaseFilter } from '../transaction-base-filter/transaction-base-filter';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

import { TransactionTypeFilterItem } from './transaction-type-filter-item';

interface Props {
    readonly value: TransactionTypeEnum[] | null;
    readonly onChange: (value: TransactionTypeEnum[] | null) => void;
}

const types = [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME, TransactionTypeEnum.TRANSFER, TransactionTypeEnum.DEBT];

export const TransactionTypeFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [localValue, setLocalValue] = useState<TransactionTypeEnum[] | null>(() => value);
    const { t } = useLingui();

    const handleOpen = () => {
        setLocalValue(value);
        void ref.current?.open();
    };
    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        onChange(localValue);
        ref.current?.close();
    };

    const selectedTypesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTypesCount) ? t`Type (${selectedTypesCount})` : t`Type`;

    const localSelectedCount = localValue?.length ?? 0;

    const handleSelect = (selected: TransactionTypeEnum) => {
        setLocalValue(prev => {
            if (!isDefined(prev)) {
                return [selected];
            }

            if (prev.includes(selected)) {
                const newFilters = prev.filter(type => selected !== type);

                return isNotEmptyArray(newFilters) ? newFilters : null;
            }

            return [...prev, selected];
        });
    };

    return (
        <>
            <TransactionFilterChip isActive={isPositiveNumber(selectedTypesCount)} icon="Layers" label={label} onPress={handleOpen} />

            <TransactionBaseFilter
                title={t`Transaction Type`}
                onApply={handleApply}
                onClear={handleClear}
                icon="Layers"
                selected={localSelectedCount}
                ref={ref}
                hasSelected={isPositiveNumber(localSelectedCount)}
                enableDynamicSizing
                useBottomSheetView
            >
                <View className="flex-row flex-wrap -mx-sm px-7xl py-7xl gap-y-xl">
                    {types.map(type => (
                        <View className="w-1/2 px-sm" key={type}>
                            <TransactionTypeFilterItem
                                type={type}
                                onSelect={handleSelect}
                                isSelected={localValue?.includes(type) ?? false}
                            />
                        </View>
                    ))}
                </View>
            </TransactionBaseFilter>
        </>
    );
};
