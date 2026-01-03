import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly daysRemaining: number;
}

export const WidgetHeader = ({ title, daysRemaining }: Props) => (
    <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
            <Icon icon={UserIconNameEnum.Wallet} size={18} className="text-primary" />
            <Text className="text-sm font-semibold text-primary">{title}</Text>
        </View>
        <View className="flex-row items-center gap-1">
            <Text className="text-xs text-secondary-foreground">
                <Trans>{daysRemaining}d left</Trans>
            </Text>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </View>
    </View>
);
