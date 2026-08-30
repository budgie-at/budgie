import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { DebtProgressTrack } from '../debt-progress-track/debt-progress-track';

interface Props {
    readonly directionIcon: UserIconNameEnum;
    readonly directionLabel: string;
    readonly percentage: number;
}

export const DebtAccountCardFooter = ({ directionIcon, directionLabel, percentage }: Props) => (
    <View className="gap-y-sm">
        <View className="flex-row items-center justify-between gap-x-xs">
            <View className="flex-row flex-1 items-center gap-x-xxs min-w-0">
                <Icon icon={directionIcon} size={10} className="shrink-0 text-secondary-foreground" />
                <Text className="text-secondary-foreground text-xxs flex-shrink" ellipsizeMode="tail" numberOfLines={1}>
                    {directionLabel}
                </Text>
            </View>

            <Text className="text-xxs font-semibold text-primary shrink-0">{percentage}%</Text>
        </View>

        <DebtProgressTrack percentage={percentage} className="h-1.5" />
    </View>
);
