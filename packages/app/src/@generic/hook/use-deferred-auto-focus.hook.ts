import { useEffect, useRef, useState } from 'react';

import { useMorphingSheetPageSettled } from '../context/morphing-sheet-page-settled.context';

import type { TextInput } from 'react-native';

export const useDeferredAutoFocus = (isEnabled: boolean) => {
    const isPageSettled = useMorphingSheetPageSettled();
    const [isDeferred] = useState(!isPageSettled);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isEnabled && isDeferred && isPageSettled) {
            inputRef.current?.focus();
        }
    }, [isEnabled, isDeferred, isPageSettled]);

    return { inputRef, autoFocus: isEnabled && !isDeferred };
};
