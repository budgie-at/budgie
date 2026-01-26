import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { ConfirmActionModalContext, ConfirmActionModalParams } from '../context/confirm-action-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const ConfirmActionModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<ConfirmActionModalParams | null>(null);
    const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

    const openConfirmAction = (params: ConfirmActionModalParams): Promise<boolean> =>
        new Promise(resolve => {
            setCurrentParams(params);
            resolverRef.current = resolve;
            router.push('/confirm-action');
        });

    const updateConfirmActionParams = (params: Partial<ConfirmActionModalParams>) => {
        setCurrentParams(current => (current ? { ...current, ...params } : null));
    };

    const resolveConfirmAction = (confirmed: boolean) => {
        resolverRef.current?.(confirmed);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openConfirmAction, resolveConfirmAction, updateConfirmActionParams, currentParams };

    return <ConfirmActionModalContext value={value}>{children}</ConfirmActionModalContext>;
};
