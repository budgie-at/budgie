import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { NoteInputModalContext } from '../context/note-input-modal.context';

import type { NoteInputModalParams } from '../context/note-input-modal.context';

export const NoteInputModalProvider = createModalProvider<NoteInputModalParams, string | null>(NoteInputModalContext, '/note-input');
