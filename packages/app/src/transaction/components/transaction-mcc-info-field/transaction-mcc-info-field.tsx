import { MccCategoryEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

interface Props {
    readonly mccCategory: MccCategoryEntityInterface;
}

export const TransactionMccInfoField = ({ mccCategory }: Props) => (
    <View className="px-lg py-xs rounded-full bg-primary/10 border border-secondary-corner self-center mb-md">
        <Text className="text-xxs font-medium text-secondary-foreground">{mccCategory.shortDescription}</Text>
    </View>
);
