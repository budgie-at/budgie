import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { TRANSACTION_ICON } from '../../constant/transaction-icon.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { TransactionFilterCard } from '../transaction-filter-card/transaction-filter-card';

interface Props {
    readonly isSelected: boolean;
    readonly type: TransactionTypeEnum;
    readonly onSelect: (type: TransactionTypeEnum) => void;
}

export const TransactionTypeFilterItem = ({ type, isSelected, onSelect }: Props) => {
    const { i18n } = useLingui();

    const handlePress = () => void onSelect(type);

    return (
        <TransactionFilterCard
            onPress={handlePress}
            isSelected={isSelected}
            icon={TRANSACTION_ICON[type]}
            variant={TRANSACTION_COLOR[type]}
            label={i18n.t(TRANSACTION_TYPE[type])}
        />
    );
};
