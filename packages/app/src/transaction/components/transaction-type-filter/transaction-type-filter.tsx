import { TransactionTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../../../@generic/components/bottom-sheet-view/bottom-sheet-view';
import { Button } from '../../../@generic/components/button/button';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FilterChip } from '../../../@generic/components/filter-chip/filter-chip';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { TransactionTypeFilterItem } from '../transaction-type-filter-item/transaction-type-filter-item';

interface Props {
    readonly value: TransactionTypeEnum[] | null;
    readonly onChange: (value: TransactionTypeEnum[] | null) => void;
}

export const TransactionTypeFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [localValue, setLocalValue] = useState<TransactionTypeEnum[] | null>(() => value);
    const { t } = useLingui();

    const handleOpen = () => ref.current?.open();

    const handleClear = () => {
        setLocalValue(null);
        onChange(null);
        ref.current?.close();
    };

    const handleApply = () => {
        onChange(localValue);
        ref.current?.close();
    };

    const selectedTypesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTypesCount) ? t`Type (${selectedTypesCount})` : t`Type`;

    const localSelectedCount = localValue?.length ?? 0;
    const buttonText = isPositiveNumber(localSelectedCount) ? t`Apply Filter (${localSelectedCount})` : t`Apply Filter`;

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
            <FilterChip isActive={isPositiveNumber(selectedTypesCount)} icon="Layers" label={label} onPress={handleOpen} />

            <BottomSheet enableDynamicSizing ref={ref}>
                <BottomSheetView>
                    <View className="flex-row items-center gap-x-xl px-7xl py-3xl border-b border-b-secondary-corner">
                        <CircleIcon icon={ICONS.Layers} variant="ghost" size="xl" />

                        <Text className="text-primary font-semibold text-3xl mr-auto">
                            <Trans>Transaction Type</Trans>
                        </Text>

                        <HapticPressable onPress={handleClear}>
                            <Text className="text-primary text-sm font-medium">
                                <Trans>Clear</Trans>
                            </Text>
                        </HapticPressable>
                    </View>

                    <View className="pt-[40px] px-7xl flex-row flex-wrap -mx-sm">
                        <View className="w-1/2 px-sm mb-xl">
                            <TransactionTypeFilterItem
                                type={TransactionTypeEnum.EXPENSE}
                                onSelect={handleSelect}
                                isSelected={localValue?.includes(TransactionTypeEnum.EXPENSE) ?? false}
                            />
                        </View>
                        <View className="w-1/2 px-sm mb-xl">
                            <TransactionTypeFilterItem
                                type={TransactionTypeEnum.INCOME}
                                onSelect={handleSelect}
                                isSelected={localValue?.includes(TransactionTypeEnum.INCOME) ?? false}
                            />
                        </View>
                        <View className="w-1/2 px-sm mb-xl">
                            <TransactionTypeFilterItem
                                type={TransactionTypeEnum.TRANSFER}
                                onSelect={handleSelect}
                                isSelected={localValue?.includes(TransactionTypeEnum.TRANSFER) ?? false}
                            />
                        </View>
                        <View className="w-1/2 px-sm mb-xl">
                            <TransactionTypeFilterItem
                                type={TransactionTypeEnum.DEBT}
                                onSelect={handleSelect}
                                isSelected={localValue?.includes(TransactionTypeEnum.DEBT) ?? false}
                            />
                        </View>
                    </View>

                    <View className="px-7xl pt-4xl border-t border-t-secondary-corner">
                        <Button onPress={handleApply} variant="ghost" content={buttonText} />
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </>
    );
};
