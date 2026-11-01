import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly primary: string;
    readonly secondary: string;
    readonly isEnabled: boolean;
    readonly testID: string;
}

export const RuleListRowTitle = ({ primary, secondary, isEnabled, testID }: Props) => {
    const primaryClassName = isEnabled
        ? 'text-[17px] leading-[22px] font-semibold text-primary'
        : 'text-[17px] leading-[22px] font-semibold text-secondary-foreground';

    return (
        <View testID={testID} className="flex-row items-baseline">
            <View className="min-w-0 shrink">
                <Text className={primaryClassName} numberOfLines={1}>
                    {primary}
                </Text>
            </View>
            {isNotEmptyString(secondary) ? (
                <Text className="shrink-0 text-[17px] leading-[22px] text-secondary-foreground" numberOfLines={1}>
                    {secondary}
                </Text>
            ) : null}
        </View>
    );
};
