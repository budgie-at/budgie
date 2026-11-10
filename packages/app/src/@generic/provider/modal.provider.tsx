import { type PropsWithChildren, useState } from 'react';

import { ModalContext } from '../context/modal.context';
import { ModalStore } from '../store/modal.store';

import { HostAccessibilityProvider } from './host-accessibility.provider';

export const ModalProvider = ({ children }: PropsWithChildren) => {
    const [modalStore] = useState(() => new ModalStore());

    return (
        <ModalContext value={modalStore}>
            <HostAccessibilityProvider>{children}</HostAccessibilityProvider>
        </ModalContext>
    );
};
