import { TransactionTypeEnum } from '@budgie/contracts';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';

import type { IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly type: TransactionTypeEnum;
    readonly onNavigate: (type: TransactionTypeEnum) => void;
}

export const CreateTransactionCard = ({ title, description, type, icon, onNavigate }: Props) => {
    const handleNavigate = () => void onNavigate(type);
    const iconParams = { variant: TRANSACTION_COLOR[type], size: 52, iconSize: 24, border: false };

    return (
        <SimpleHorizontalCell
            description={description}
            iconParams={iconParams}
            onPress={handleNavigate}
            title={title}
            icon={icon}
            size="lg"
        />
    );
};
