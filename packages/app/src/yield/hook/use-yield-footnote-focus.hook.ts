import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

import { isNumber } from '@rnw-community/shared';

import type { View } from 'react-native';

export const useYieldFootnoteFocus = (isFailure: boolean) => {
    const footnoteRef = useRef<View>(null);
    const wasFailureRef = useRef(false);

    useEffect(() => {
        const node = findNodeHandle(footnoteRef.current);

        if (wasFailureRef.current && !isFailure && isNumber(node)) {
            AccessibilityInfo.setAccessibilityFocus(node);
        }

        wasFailureRef.current = isFailure;
    }, [isFailure]);

    return footnoteRef;
};
