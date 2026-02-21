import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { Contact } from '../hook/use-contacts.hook';

export interface ContactSelectorModalParams {
    readonly selectedContactId: string | null;
}

export type ContactSelectorResult = Contact | null;

interface ContactSelectorModalContextInterface {
    openContactSelector: (params?: ContactSelectorModalParams) => Promise<ContactSelectorResult>;
    resolveContactSelector: (result: ContactSelectorResult) => void;
    currentParams: ContactSelectorModalParams | null;
}

export const ContactSelectorModalContext = createContext<ContactSelectorModalContextInterface>({
    openContactSelector: () => Promise.resolve(null),
    resolveContactSelector: emptyFn,
    currentParams: null
});

export const useContactSelectorModal = () => use(ContactSelectorModalContext);
