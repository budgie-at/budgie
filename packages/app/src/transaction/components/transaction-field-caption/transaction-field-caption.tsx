import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly label: string;
    readonly value?: string;
    readonly placeholder?: string;
    readonly testID?: string;
}

export const TransactionFieldCaption = ({ label, value, placeholder, testID }: Props) => {
    const hasValue = isNotEmptyString(value);
    const displayValue = hasValue ? value : (placeholder ?? t`not set`);
    const valueClassName = hasValue ? 'text-[17px] leading-[22px] text-primary' : 'text-[17px] leading-[22px] text-secondary-foreground';

    return (
        <View className="min-w-0 gap-y-[4px]">
            <Text className="text-[13px] leading-[18px] text-secondary-foreground">{label}</Text>

            <Text className={valueClassName} numberOfLines={2} ellipsizeMode="tail" testID={testID}>
                {displayValue}
            </Text>
        </View>
    );
};
