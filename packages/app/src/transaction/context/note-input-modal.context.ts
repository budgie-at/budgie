/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

export interface NoteInputModalParams {
    readonly initialValue?: string;
}

interface NoteInputModalContextInterface {
    readonly openNoteInput: (params?: NoteInputModalParams) => Promise<string | null>;
    readonly resolveNoteInput: (value: string | null) => void;
    readonly currentParams: NoteInputModalParams | null;
}

export const NoteInputModalContext = createContext<NoteInputModalContextInterface | null>(null);

export const useNoteInputModal = () => {
    const context = use(NoteInputModalContext);

    if (context === null) {
        throw new Error('useNoteInputModal must be used within NoteInputModalProvider');
    }

    return context;
};
