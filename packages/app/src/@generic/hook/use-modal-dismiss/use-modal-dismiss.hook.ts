import { useEffect, useEffectEvent } from 'react';

export const useModalDismiss = (dismiss: () => void) => {
    const handleDismiss = useEffectEvent(dismiss);

    useEffect(
        () => () => {
            handleDismiss();
        },
        []
    );
};
