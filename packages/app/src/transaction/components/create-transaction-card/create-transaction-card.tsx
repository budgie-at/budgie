import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';

interface Props {
    readonly title: string;
    readonly icon: UserIconNameEnum;
    readonly description: string;
    readonly type: TransactionTypeEnum;
    readonly onNavigate: (type: TransactionTypeEnum) => void;
}

export const CreateTransactionCard = ({ title, description, type, icon, onNavigate }: Props) => {
    const handleNavigate = () => void onNavigate(type);

    return (
        <SimpleHorizontalCell
            description={description}
            left={<CircleIcon icon={icon} variant={TRANSACTION_COLOR[type]} size={52} iconSize={24} border={false} />}
            onPress={handleNavigate}
            title={title}
            size="lg"
        />
    );
};
