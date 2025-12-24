import { TransactionTypeEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
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

    return (
        <Card onPress={handleNavigate} className="p-5xl items-center gap-x-4 flex-row" key={title}>
            <CircleIcon border={false} className="rounded-5xl w-12 h-12" icon={ICONS[icon]} size="xl" variant={TRANSACTION_COLOR[type]} />

            <View className="mr-auto">
                <Text className="text-primary text-md font-medium">{title}</Text>
                <Text className="text-secondary-foreground text-sm">{description}</Text>
            </View>

            <Icon className="text-primary/40" icon={ICONS.ChevronRight} />
        </Card>
    );
};
