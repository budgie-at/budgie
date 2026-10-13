import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { TransactionFilterCard } from '../transaction-filter-card/transaction-filter-card';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

const TRANSACTION_ICON: Record<TransactionTypeEnum, UserIconNameEnum> = {
    [TransactionTypeEnum.TRANSFER]: UserIconNameEnum.ArrowRightLeft,
    [TransactionTypeEnum.INCOME]: UserIconNameEnum.TrendingUp,
    [TransactionTypeEnum.DEBT]: UserIconNameEnum.CreditCard,
    [TransactionTypeEnum.EXPENSE]: UserIconNameEnum.TrendingDown,
    [TransactionTypeEnum.ADJUSTMENT]: UserIconNameEnum.BadgePlus
};

interface Props {
    readonly isSelected: boolean;
    readonly type: TransactionTypeEnum;
    readonly onSelect: (type: TransactionTypeEnum) => void;
}

export const TransactionTypeFilterItem = ({ type, isSelected, onSelect }: Props) => {
    const { t } = useLingui();

    const handlePress = () => void onSelect(type);

    return (
        <TransactionFilterCard
            onPress={handlePress}
            isSelected={isSelected}
            icon={TRANSACTION_ICON[type]}
            variant={TRANSACTION_COLOR[type]}
            label={t(TRANSACTION_TYPE[type])}
            testID={TransactionFiltersSelector.TypeOption(type)}
        />
    );
};
