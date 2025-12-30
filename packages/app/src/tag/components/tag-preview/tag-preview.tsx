import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';

interface Props {
    readonly title: string;
}

export const TagPreview = ({ title }: Props) => (
    <Card className="gap-y-lg">
        <Text className="uppercase text-secondary-foreground text-xs">
            <Trans>Preview</Trans>
        </Text>

        <View className="flex-row items-center gap-x-xl">
            <View className="h-10 w-10 rounded-full bg-destructive-background border-2 border-destructive-corner items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-destructive-foreground" />
            </View>

            <Text className="text-primary flex-1">{title}</Text>
        </View>
    </Card>
);
