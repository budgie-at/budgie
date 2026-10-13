import { useEffect, useRef } from 'react';

export const useModalDismiss = (dismiss: () => void) => {
    const dismissRef = useRef(dismiss);

    useEffect(() => {
        dismissRef.current = dismiss;
    });

    useEffect(
        () => () => {
            dismissRef.current();
        },
        []
    );
};
