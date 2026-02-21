import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../@generic/component/button/button';
import { Footer } from '../@generic/component/footer/footer';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { TransactionFilterHeader } from '../transaction/components/transaction-filter-header/transaction-filter-header';
import { TransactionTypeFilterItem } from '../transaction/components/transaction-type-filter/transaction-type-filter-item';
import { useTransactionTypeFilterModal } from '../transaction/context/transaction-type-filter-modal.context';

const TRANSACTION_TYPES = [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME, TransactionTypeEnum.TRANSFER, TransactionTypeEnum.DEBT];

export default function TransactionTypeFilterModal() {
    const { t } = useLingui();
    const { currentParams, resolveTransactionTypeFilter } = useTransactionTypeFilterModal();
    const { backgroundColor } = useFormsheetListStyles();

    const [localValue, setLocalValue] = useState<TransactionTypeEnum[] | null>(() => currentParams?.value ?? null);

    const localSelectedCount = localValue?.length ?? 0;
    const buttonText = isPositiveNumber(localSelectedCount) ? t`Apply Filter (${localSelectedCount})` : t`Apply Filter`;
    const containerStyle = { flex: 1, backgroundColor };

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

    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveTransactionTypeFilter({ value: localValue });
    };

    return (
        <View style={containerStyle}>
            <TransactionFilterHeader
                title={t`Transaction Type`}
                icon={UserIconNameEnum.Layers}
                onClear={handleClear}
                showClear={isPositiveNumber(localSelectedCount)}
            />

            <View className="flex-row flex-wrap -mx-sm px-7xl py-7xl gap-y-xl">
                {TRANSACTION_TYPES.map(type => (
                    <View className="w-1/2 px-sm" key={type}>
                        <TransactionTypeFilterItem type={type} onSelect={handleSelect} isSelected={localValue?.includes(type) ?? false} />
                    </View>
                ))}
            </View>

            <Footer>
                <Button variant="ghost" onPress={handleApply} content={buttonText} />
            </Footer>
        </View>
    );
}
