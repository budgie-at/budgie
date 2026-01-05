import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

interface Props {
    readonly formattedAmount: string;
}

export const AiTransactionAmountDisplay = ({ formattedAmount }: Props) => (
    <View className="bg-secondary-background rounded-2xl p-4xl">
        <Text className="text-secondary-foreground text-xs uppercase mb-xs">
            <Trans>Amount</Trans>
        </Text>
        <Text className="text-destructive-foreground text-2xl font-bold">{formattedAmount}</Text>
    </View>
);
