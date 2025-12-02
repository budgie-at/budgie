import { TransactionFilterInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import React, { useRef } from 'react';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { TransactionFilterSelectorBottomSheet } from '../transaction-filter-selector-bottom-sheet/transaction-filter-selector-bottom-sheet';

interface Props {
    readonly selectedFilters: TransactionFilterInterface;
    readonly onFiltersChange: (filters: TransactionFilterInterface) => void;
}

export const TransactionFilterSelector = ({ selectedFilters, onFiltersChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <HapticPressable onPress={handleOpen} className="border border-secondary-corner rounded-2xl px-lg py-md">
                <Text className="text-primary font-medium text-xs">
                    <Trans>Filters</Trans>
                </Text>
            </HapticPressable>

            <TransactionFilterSelectorBottomSheet onFiltersChange={onFiltersChange} selectedFilters={selectedFilters} ref={ref} />
        </>
    );
};
