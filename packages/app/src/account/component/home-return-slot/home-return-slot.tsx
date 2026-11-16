import { View } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { HomeReturnSlotStateEnum } from '../../enum/home-return-slot-state.enum';
import { resolveHomeReturnSlotState } from '../../utils/resolve-home-return-slot-state.util';

import type { ReactNode } from 'react';

interface Props {
    readonly isSuppressed: boolean;
    readonly isPending: boolean;
    readonly isEmpty: boolean;
    readonly children: ReactNode;
}

export const HomeReturnSlot = ({ isSuppressed, isPending, isEmpty, children }: Props) => {
    const state = resolveHomeReturnSlotState(isSuppressed, useIsAccessibilityTextSize(), isPending, isEmpty);

    const isReserved = state === HomeReturnSlotStateEnum.RESERVED;
    const importantForAccessibility = isReserved ? 'no-hide-descendants' : 'auto';

    if (state === HomeReturnSlotStateEnum.ABSENT) {
        return null;
    }

    return (
        <View
            className={cn(isReserved && 'opacity-0')}
            accessibilityElementsHidden={isReserved}
            importantForAccessibility={importantForAccessibility}
        >
            <LoadingContent isLoading={state === HomeReturnSlotStateEnum.PENDING} loadingIndicator={null}>
                {children}
            </LoadingContent>
        </View>
    );
};
