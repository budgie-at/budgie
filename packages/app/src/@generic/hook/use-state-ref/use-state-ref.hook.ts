import { Dispatch, SetStateAction, useRef, useState } from 'react';

import { isStateUpdater } from '../../type-guard/is-state-updater.type-guard';

export const useStateRef = <T>(initialState: T | (() => T)) => {
    const [value, setValue] = useState(initialState);
    const valueRef = useRef(value);

    const setValueRef: Dispatch<SetStateAction<T>> = nextValue => {
        setValue(prevValue => {
            const resolvedValue = isStateUpdater(nextValue) ? nextValue(prevValue) : nextValue;

            valueRef.current = resolvedValue;

            return resolvedValue;
        });
    };

    return [value, setValueRef, valueRef] as const;
};
