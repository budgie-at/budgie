import { useEffect, useRef, useState } from 'react';

import { useSurfaceSettled } from '../context/surface-settled.context';

import type { TextInput } from 'react-native';

export const useDeferredAutoFocus = (isEnabled: boolean) => {
    const isSettled = useSurfaceSettled();
    const [isDeferred] = useState(!isSettled);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isEnabled && isDeferred && isSettled) {
            inputRef.current?.focus();
        }
    }, [isEnabled, isDeferred, isSettled]);

    return { inputRef, autoFocus: isEnabled && !isDeferred };
};
