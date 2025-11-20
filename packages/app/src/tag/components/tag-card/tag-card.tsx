import { TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';

interface Props {
    tag: TagEntityInterface;
    onOpen: (tag: TagEntityInterface) => void;
}

export const TagCard = ({ onOpen, tag }: Props) => {
    const handleOpen = () => void onOpen(tag);

    return (
        <Card onPress={handleOpen} className="flex-row gap-x-xl items-center">
            <View className="h-[40px] w-[40px] rounded-full bg-destructive-background border-2 border-destructive-corner items-center justify-center">
                <View className="w-[12px] h-[12px] rounded-full bg-destructive-foreground" />
            </View>

            <Text className="text-primary text-sm">{tag.title}</Text>
            <Text className="text-secondary-foreground font-medium text-xs ml-auto">
                <Trans>Swipe left</Trans>
            </Text>
        </Card>
    );
};
