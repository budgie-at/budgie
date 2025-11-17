import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly title: string;
    readonly left: ReactNode;
    readonly onPress?: EmptyFn;
    readonly right?: ReactNode;
    readonly className?: string;
    readonly description: string;
}

export const SettingsCard = ({className, title, description, onPress, right, left }: Props) => (
    <Card onPress={onPress} className={cn("flex-row items-center gap-x-xl bg-secondary-background", className)}>
        {left}

        <View className="gap-y-xxs flex-1">
            <Text className="text-primary text-md">{title}</Text>
            <Text className="text-secondary-foreground text-sm">{description}</Text>
        </View>

        {right}
    </Card>
);
