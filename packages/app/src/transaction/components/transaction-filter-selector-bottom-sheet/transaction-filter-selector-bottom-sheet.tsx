import { TransactionFilterInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/components/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../../../@generic/components/bottom-sheet-view/bottom-sheet-view';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useTransactionFilters } from '../../hook/use-transaction-filter.hook';
import { TransactionDatePeriodFilterSection } from '../transaction-date-period-filter-section/transaction-date-period-filter-section';
import { TransactionFilterActions } from '../transaction-filter-actions/transaction-filter-actions';
import { TransactionTypeFilterSection } from '../transaction-type-filter-section/transaction-type-filter-section';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedFilters: TransactionFilterInterface;
    readonly onFiltersChange: (filters: TransactionFilterInterface) => void;
}

export const TransactionFilterSelectorBottomSheet = ({ ref, selectedFilters, onFiltersChange }: Props) => {
    const { t } = useLingui();

    const { localFilters, handleTypeChange, handlePeriodChange, handleCancel, handleApply } = useTransactionFilters(
        selectedFilters,
        onFiltersChange,
        ref
    );

    const headerTitle = t`Filter Transactions`;
    const headerDescription = t`Refine your transaction view`;

    return (
        <BottomSheet enableDynamicSizing ref={ref}>
            <BottomSheetView>
                <BottomSheetHeader
                    className="border-b border-b-secondary-corner"
                    size="lg"
                    title={headerTitle}
                    description={headerDescription}
                />

                <View className="px-5xl py-7xl">
                    <TransactionTypeFilterSection selectedType={localFilters.type} onTypeChange={handleTypeChange} />

                    <View className="h-[1px] bg-secondary-background my-7xl" />

                    <TransactionDatePeriodFilterSection selectedPeriod={localFilters.period} onPeriodChange={handlePeriodChange} />
                </View>

                <TransactionFilterActions onCancel={handleCancel} onApply={handleApply} />
            </BottomSheetView>
        </BottomSheet>
    );
};
