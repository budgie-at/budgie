import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly children: ReactNode;
}

const ICON_SIZE = 12;

export const RuleActionPillContainer = ({ icon, children }: Props) => (
    <View className="flex-row items-center gap-x-sm rounded-2xl border border-secondary-corner bg-ghost-background px-lg py-md">
        <Icon icon={icon} size={ICON_SIZE} className="text-primary" />
        <Text className="text-xs text-primary">{children}</Text>
    </View>
);
