import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { TRANSACTION_ICON } from '../../constant/transaction-icon.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { TransactionFilterCard } from '../transaction-filter-card/transaction-filter-card';

interface Props {
    readonly type: TransactionTypeEnum;
    readonly selectedType: TransactionTypeEnum | null;
    readonly onTypeChange: (type: TransactionTypeEnum | null) => void;
}

export const TransactionTypeFilterItem = ({ type, selectedType, onTypeChange }: Props) => {
    const { i18n } = useLingui();

    const handlePress = () => void onTypeChange(type);

    return (
        <View className="w-1/2 px-xs">
            <TransactionFilterCard
                isSelected={type === selectedType}
                onPress={handlePress}
                icon={TRANSACTION_ICON[type]}
                label={i18n.t(TRANSACTION_TYPE[type])}
            />
        </View>
    );
};
