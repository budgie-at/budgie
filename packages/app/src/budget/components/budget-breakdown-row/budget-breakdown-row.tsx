import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';

interface Props {
    readonly label: string;
    readonly amount: string;
}

export const BudgetBreakdownRow = ({ label, amount }: Props) => {
    const rowClassName = useIsLargeTextSize() ? 'gap-y-xxs' : 'flex-row items-baseline justify-between gap-x-md';

    return (
        <View className={rowClassName}>
            <Text className="shrink text-sm text-secondary-foreground">{label}</Text>
            <ProtectedText className="min-w-0 shrink text-sm tabular-nums text-primary" adjustsFontSizeToFit minimumFontScale={0.6}>
                {amount}
            </ProtectedText>
        </View>
    );
};
