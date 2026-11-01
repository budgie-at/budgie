import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly summary: string | null;
    readonly children: ReactNode;
}

const MIN_BOTTOM_SPACING = 16;

export const DestinationSheetFooter = ({ summary, children }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const style = { paddingBottom: Math.max(bottom, MIN_BOTTOM_SPACING) };

    return (
        <View className="gap-y-md border-t-hairline border-surface-separator bg-primary-reverse px-xl pt-lg" style={style}>
            {isNotEmptyString(summary) ? (
                <Text className="text-secondary-foreground px-md text-[15px] leading-[20px]" accessibilityLiveRegion="polite">
                    {summary}
                </Text>
            ) : null}
            {children}
        </View>
    );
};
