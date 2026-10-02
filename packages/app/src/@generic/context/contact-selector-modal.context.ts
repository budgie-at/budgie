import { Contact } from '../hook/use-contacts.hook';
import { createModalContext } from '../utils/create-modal-context/create-modal-context.util';

export interface ContactSelectorModalParams {
    readonly selectedContactId: string | null;
}

export type ContactSelectorResult = Contact | null;

export const [ContactSelectorModalContext, useContactSelectorModal, useContactSelectorModalParams] = createModalContext<
    ContactSelectorModalParams,
    ContactSelectorResult
>(null);
