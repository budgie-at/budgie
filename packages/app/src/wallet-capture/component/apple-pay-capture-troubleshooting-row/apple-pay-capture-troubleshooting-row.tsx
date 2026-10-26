import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description: string;
}

export const ApplePayCaptureTroubleshootingRow = ({ icon, title, description }: Props) => (
    <View className="flex-row items-start gap-x-xl">
        <CircleIcon icon={icon} variant="ghost" size={32} iconSize={16} radius={16} />
        <View className="flex-1 gap-y-xs">
            <Text className="text-primary text-sm font-semibold">{title}</Text>
            <Text className="text-secondary-foreground text-sm">{description}</Text>
        </View>
    </View>
);
