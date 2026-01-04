import { MccCategoryEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

interface Props {
    readonly mccCategory: MccCategoryEntityInterface;
}

export const TransactionMccInfoField = ({ mccCategory }: Props) => (
    <View className="px-sm py-xs rounded-full bg-primary border border-primary self-center mb-md">
        <Text className="text-xxs font-medium text-primary-foreground">{mccCategory.shortDescription}</Text>
    </View>
);
