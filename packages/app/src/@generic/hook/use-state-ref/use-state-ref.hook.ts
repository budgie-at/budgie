import { Dispatch, SetStateAction, useRef, useState } from 'react';

export const useStateRef = <T>(initialState: T | (() => T)) => {
    const [value, setValue] = useState(initialState);
    const valueRef = useRef(value);

    const setValueRef: Dispatch<SetStateAction<T>> = nextValue => {
        setValue(prevValue => {
            const resolvedValue = typeof nextValue === 'function' ? (nextValue as (prevState: T) => T)(prevValue) : nextValue;

            valueRef.current = resolvedValue;

            return resolvedValue;
        });
    };

    return [value, setValueRef, valueRef] as const;
};
