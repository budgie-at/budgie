import { UserIconType } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly body: string;
    readonly testID: string;
    readonly children?: ReactNode;
}

export const CloudBackupEmptyStateCard = ({ icon, title, body, testID, children }: Props) => (
    <View className="items-center gap-y-xl px-5xl pt-7xl" testID={testID}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Icon icon={icon} size={48} className="text-secondary-foreground" />
        </View>
        <View className="items-center gap-y-sm">
            <Text className="text-primary text-center text-xl font-semibold" accessibilityRole="header">
                {title}
            </Text>
            <Text className="text-secondary-foreground text-center text-md">{body}</Text>
        </View>
        {isDefined(children) ? <View className="mt-md">{children}</View> : null}
    </View>
);
