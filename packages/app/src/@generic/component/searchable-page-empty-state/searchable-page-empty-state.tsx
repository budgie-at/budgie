import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../circle-icon/circle-icon';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly icon: UserIconNameEnum;
    readonly description: string;
    readonly testID?: string;
    readonly children?: ReactNode;
}

export const SearchablePageEmptyState = ({ title, icon, description, testID, children }: Props) => (
    <View testID={testID} collapsable={false} className="items-center gap-y-xl px-6xl pt-[72px]">
        <View className="items-center">
            <CircleIcon icon={icon} size={64} iconSize={32} variant="ghost" className="text-secondary-foreground mb-xl rounded-5xl" />
            <Text className="text-primary text-center text-md font-medium mb-sm" numberOfLines={2} accessibilityLabel={title}>
                {title}
            </Text>
            <Text className="text-secondary-foreground text-center text-sm max-w-70">{description}</Text>
        </View>
        {children}
    </View>
);
