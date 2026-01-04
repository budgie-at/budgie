import { MccCategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

interface Props {
    readonly mccCategory: MccCategoryEntityInterface;
}

export const TransactionMccInfoField = ({ mccCategory }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row items-center gap-x-xs px-sm py-xs rounded-full bg-secondary-background self-start">
            <Text className="text-xxs text-secondary-foreground/70">{t`MCC`}:</Text>
            <Text className="text-xxs font-medium text-primary/70">{mccCategory.shortDescription}</Text>
        </View>
    );
};
