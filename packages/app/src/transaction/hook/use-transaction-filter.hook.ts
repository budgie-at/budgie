import { DatePeriodEnum, TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { RefObject, useState } from 'react';

import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';

export const useTransactionFilters = (
    selectedFilters: TransactionFilterInterface,
    onFiltersChange: (filters: TransactionFilterInterface) => void,
    ref: RefObject<BottomSheetInterface | null>
) => {
    const [localFilters, setLocalFilters] = useState(() => selectedFilters);

    const handleTypeChange = (type: TransactionTypeEnum | null) => {
        setLocalFilters(prev => ({ ...prev, type }));
    }

    const handlePeriodChange = (period: DatePeriodEnum) => {
        setLocalFilters(prev => ({ ...prev, period }));
    }

    const handleCancel = () => {
        setLocalFilters(selectedFilters);
        ref.current?.close();
    }

    const handleApply = () => {
        onFiltersChange(localFilters);
        ref.current?.close();
    }

    return {
        localFilters,
        handleTypeChange,
        handlePeriodChange,
        handleCancel,
        handleApply
    };
};
