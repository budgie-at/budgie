import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

const STATUS_ICON_SIZE = 14;

interface Props {
    readonly icon: UserIconNameEnum;
    readonly iconClassName: string;
    readonly textClassName: string;
    readonly children: ReactNode;
}

export const SwipeableRuleCardStatus = ({ icon, iconClassName, textClassName, children }: Props) => (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
        <View className="flex-row items-center gap-xs rounded-full border border-secondary-corner bg-secondary-background px-md py-xs">
            <Icon icon={icon} size={STATUS_ICON_SIZE} className={iconClassName} />
            <Text className={textClassName}>{children}</Text>
        </View>
    </Animated.View>
);
