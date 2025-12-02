import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { TransactionFilterCard } from '../transaction-filter-card/transaction-filter-card';
import { TransactionFilterSectionHeader } from '../transaction-filter-section-header/transaction-filter-section-header';
import { TransactionTypeFilterItem } from '../transaction-type-filter-item/transaction-type-filter-item';

interface Props {
    readonly selectedType: TransactionTypeEnum | null;
    readonly onTypeChange: (type: TransactionTypeEnum | null) => void;
}

export const TransactionTypeFilterSection = ({ selectedType, onTypeChange }: Props) => {
    const { t } = useLingui();

    const isAllTypesSelected = selectedType === null;
    const handleAllTypesPress = () => void onTypeChange(null);

    return (
        <View className="flex-1">
            <TransactionFilterSectionHeader title={t`Transaction Type`} />

            <View className="flex-row flex-wrap -mx-xs gap-y-md">
                <View className="w-1/2 px-xs">
                    <TransactionFilterCard
                        isSelected={isAllTypesSelected}
                        onPress={handleAllTypesPress}
                        icon="Funnel"
                        label={t`All Types`}
                    />
                </View>

                {Object.values(TransactionTypeEnum).map(type => (
                    <TransactionTypeFilterItem key={type} type={type} selectedType={selectedType} onTypeChange={onTypeChange} />
                ))}
            </View>
        </View>
    );
};
