import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';

import { NoteInputModalContext, NoteInputModalParams } from '../context/note-input-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const NoteInputModalProvider = ({ children }: Props) => {
    const [currentParams, setCurrentParams] = useState<NoteInputModalParams | null>(null);
    const resolverRef = useRef<((value: string | null) => void) | null>(null);

    const openNoteInput = (params?: NoteInputModalParams): Promise<string | null> =>
        new Promise(resolve => {
            setCurrentParams(params ?? {});
            resolverRef.current = resolve;
            router.push('/note-input');
        });

    const resolveNoteInput = (value: string | null) => {
        resolverRef.current?.(value);
        resolverRef.current = null;
        setCurrentParams(null);
        router.back();
    };

    const value = { openNoteInput, resolveNoteInput, currentParams };

    return <NoteInputModalContext value={value}>{children}</NoteInputModalContext>;
};
