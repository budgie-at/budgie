import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface NoteInputModalParams {
    readonly initialValue?: string;
}

export const [NoteInputModalContext, useNoteInputModal, useNoteInputModalParams] = createModalContext<NoteInputModalParams, string | null>(
    null
);
