import { createContext } from 'react';

import type { ModalStore } from '../store/modal.store';

export const ModalContext = createContext<ModalStore | null>(null);
