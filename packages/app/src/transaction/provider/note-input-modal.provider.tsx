import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { NoteInputModalContext, NoteInputModalParams } from '../context/note-input-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const NoteInputModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<NoteInputModalParams, string | null>('/note-input');

    const value = { openNoteInput: open, resolveNoteInput: resolve, currentParams };

    return <NoteInputModalContext value={value}>{children}</NoteInputModalContext>;
};
