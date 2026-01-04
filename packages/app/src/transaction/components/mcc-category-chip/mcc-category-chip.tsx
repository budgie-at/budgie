import { MccCategoryEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

interface Props {
    readonly mccCategory: MccCategoryEntityInterface;
}

export const MccCategoryChip = ({ mccCategory }: Props) => (
    <View className="rounded-sm py-xxs px-sm bg-secondary-background/50 border border-secondary-corner">
        <Text className="text-secondary-foreground text-xxs font-medium">{mccCategory.shortDescription}</Text>
    </View>
);
