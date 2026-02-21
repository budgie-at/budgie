import { ReactNode } from 'react';

import { ContactSelectorModalContext, ContactSelectorModalParams, ContactSelectorResult } from '../context/contact-selector-modal.context';
import { useModalResolver } from '../hook/use-modal-resolver/use-modal-resolver.hook';

interface Props {
    readonly children: ReactNode;
}

export const ContactSelectorModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<ContactSelectorModalParams, ContactSelectorResult>('/contact-selector');

    const value = { openContactSelector: open, resolveContactSelector: resolve, currentParams };

    return <ContactSelectorModalContext value={value}>{children}</ContactSelectorModalContext>;
};
