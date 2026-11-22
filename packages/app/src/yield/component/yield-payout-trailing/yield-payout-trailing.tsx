import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly amount: string;
    readonly amountClassName: string;
    readonly taxText: string;
}

export const YieldPayoutTrailing = ({ amount, amountClassName, taxText }: Props) => (
    <View className="items-end">
        <Text className={amountClassName}>{amount}</Text>
        {isNotEmptyString(taxText) ? <Text className="text-[13px] tabular-nums text-secondary-foreground">{taxText}</Text> : null}
    </View>
);
