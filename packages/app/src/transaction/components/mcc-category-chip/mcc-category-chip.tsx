import { MccCategoryEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

interface Props {
    readonly mccCategory: MccCategoryEntityInterface;
}

export const MccCategoryChip = ({ mccCategory }: Props) => (
    <View className="rounded-sm py-xxs px-sm bg-primary/5 border border-primary/10">
        <Text className="text-primary/60 text-xxs font-medium">{mccCategory.shortDescription}</Text>
    </View>
);
