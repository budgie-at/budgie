import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string | undefined;
    readonly description: string | undefined;
    readonly children: ReactNode;
}

export const SelectorModalDescription = (props: Props) => {
    const { title, description, children } = props;

    if (!isNotEmptyString(title) && !isNotEmptyString(description)) {
        return children;
    }

    return (
        <View className="flex-1">
            <View className="gap-y-xs px-3xl pb-lg">
                {isNotEmptyString(title) ? (
                    <Text className="text-primary text-[17px] font-semibold leading-[22px]" accessibilityRole="header">
                        {title}
                    </Text>
                ) : null}
                {isNotEmptyString(description) ? (
                    <Text className="text-secondary-foreground text-[15px] leading-[20px]">{description}</Text>
                ) : null}
            </View>
            <View className="flex-1">{children}</View>
        </View>
    );
};
