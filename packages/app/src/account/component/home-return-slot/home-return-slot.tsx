import { View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly isPending: boolean;
    readonly isEmpty: boolean;
    readonly children: ReactNode;
}

export const HomeReturnSlot = ({ isPending, isEmpty, children }: Props) => {
    const isStacked = useIsAccessibilityTextSize();

    const importantForAccessibility = isEmpty ? 'no-hide-descendants' : 'auto';

    if (isStacked && isEmpty) {
        return null;
    }

    return (
        <View
            className={cn(isEmpty && 'opacity-0')}
            accessibilityElementsHidden={isEmpty}
            importantForAccessibility={importantForAccessibility}
        >
            <LoadingContent isLoading={isPending} loadingIndicator={null}>
                {children}
            </LoadingContent>
        </View>
    );
};
