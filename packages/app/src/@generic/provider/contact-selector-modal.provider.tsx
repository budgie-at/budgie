import { ContactSelectorModalContext } from '../context/contact-selector-modal.context';
import { createModalProvider } from '../utils/create-modal-provider/create-modal-provider.util';

import type { ContactSelectorModalParams, ContactSelectorResult } from '../context/contact-selector-modal.context';

export const ContactSelectorModalProvider = createModalProvider<ContactSelectorModalParams, ContactSelectorResult>(
    ContactSelectorModalContext,
    '/contact-selector'
);
