import { DatePeriodEnum, TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { RefObject, useState } from 'react';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { getDateFilterByPeriod } from '../../@generic/utils/date/get-date-filter-by-period.util';

export const useTransactionFilters = (
    selectedFilters: TransactionFilterInterface,
    onFiltersChange: (filters: TransactionFilterInterface) => void,
    ref: RefObject<BottomSheetInterface | null>
) => {
    const [localFilters, setLocalFilters] = useState(() => selectedFilters);
    const [selectedPeriod, setSelectedPeriod] = useState<DatePeriodEnum | null>(null);

    const handleTypeChange = (type: TransactionTypeEnum | null) => {
        setLocalFilters(prev => ({ ...prev, type }));
    };

    const handlePeriodChange = (period: DatePeriodEnum) => {
        setSelectedPeriod(period);
        setLocalFilters(prev => ({ ...prev, date: getDateFilterByPeriod(period) }));
    };

    const handleCancel = () => {
        setLocalFilters(selectedFilters);
        ref.current?.close();
    };

    const handleApply = () => {
        onFiltersChange(localFilters);
        ref.current?.close();
    };

    return {
        localFilters,
        handleTypeChange,
        handlePeriodChange,
        selectedPeriod,
        handleCancel,
        handleApply
    };
};
