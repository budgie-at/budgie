import { useState } from 'react';
import { Keyboard } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useMorphingSheetCommit } from './use-morphing-sheet-commit.hook';

import type { DestinationSelectionInterface } from '../interface/destination-selection.interface';
import type { IdInterface } from '../interface/id.interface';

export const useDestinationSelection = <T extends IdInterface>(
    destinations: readonly T[] | undefined,
    selection: DestinationSelectionInterface,
    onCommit: (id: number) => void
) => {
    const commit = useMorphingSheetCommit(onCommit);
    const [latched, setLatched] = useState<T | null>(null);
    const found = destinations?.find(item => item.id === selection.selectedId);

    if (isDefined(found) && found.id !== latched?.id) {
        setLatched(found);
    }

    const latchedSelection = latched?.id === selection.selectedId ? latched : null;
    const selected = found ?? latchedSelection;

    const handleRowSelect = (id: number) => {
        if (isDefined(destinations?.find(item => item.id === id))) {
            Keyboard.dismiss();
            selection.onSelect(id);
        }
    };

    const handleCommit = () => {
        if (isDefined(selected)) {
            commit(selected.id);
        }
    };

    return { selected, isPending: !isDefined(destinations), handleRowSelect, handleCommit };
};
