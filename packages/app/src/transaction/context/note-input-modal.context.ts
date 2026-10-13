import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

interface NoteInputModalParams {
    readonly initialValue?: string;
}

const [NoteInputModalContext, useNoteInputModal, useNoteInputModalParams] = createModalContext<NoteInputModalParams, string | null>(null);

export { useNoteInputModal, useNoteInputModalParams };

export const NoteInputModalProvider = createModalProvider(NoteInputModalContext, '/note-input');
