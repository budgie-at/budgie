import { ReactNode, useState } from 'react';

import { ConfirmActionModalContext, ConfirmActionModalParams } from '../context/confirm-action-modal.context';
import { useModalResolver } from '../hook/use-modal-resolver/use-modal-resolver.hook';

interface Props {
    readonly children: ReactNode;
}

export const ConfirmActionModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<ConfirmActionModalParams, boolean>('/confirm-action');
    const [localParams, setLocalParams] = useState<ConfirmActionModalParams | null>(null);

    const openConfirmAction = async (params: ConfirmActionModalParams): Promise<boolean> => {
        setLocalParams(params);

        return open(params);
    };

    const updateConfirmActionParams = (params: Partial<ConfirmActionModalParams>) => {
        setLocalParams(current => (current ? { ...current, ...params } : null));
    };

    const resolveConfirmAction = (confirmed: boolean) => {
        setLocalParams(null);
        resolve(confirmed);
    };

    const value = {
        openConfirmAction,
        resolveConfirmAction,
        updateConfirmActionParams,
        currentParams: localParams ?? currentParams
    };

    return <ConfirmActionModalContext value={value}>{children}</ConfirmActionModalContext>;
};
