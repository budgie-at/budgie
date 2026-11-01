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
        ? 'max-w-full text-[17px] leading-[22px] font-semibold text-primary'
        : 'max-w-full text-[17px] leading-[22px] font-semibold text-secondary-foreground';

    return (
        <View testID={testID} className="h-[22px] flex-row flex-wrap items-baseline overflow-hidden">
            <Text className={primaryClassName} numberOfLines={1}>
                {primary}
            </Text>
            {isNotEmptyString(secondary) ? (
                <Text className="text-[17px] leading-[22px] text-secondary-foreground" numberOfLines={1}>
                    {secondary}
                </Text>
            ) : null}
        </View>
    );
};
