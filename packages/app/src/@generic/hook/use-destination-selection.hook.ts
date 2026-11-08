import { useState } from 'react';
import { Keyboard } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useMorphingSheetCommit } from './use-morphing-sheet-commit.hook';

import type { IdInterface } from '../interface/id.interface';

export const useDestinationSelection = <T extends IdInterface>(destinations: readonly T[] | undefined, onCommit: (id: number) => void) => {
    const [selected, setSelected] = useState<T | null>(null);
    const commit = useMorphingSheetCommit(onCommit);

    const handleRowSelect = (id: number) => {
        const destination = destinations?.find(item => item.id === id);

        if (isDefined(destination)) {
            Keyboard.dismiss();
            setSelected(destination);
        }
    };

    const handleCommit = () => {
        if (isDefined(selected)) {
            commit(selected.id);
        }
    };

    return { selected, setSelected, isPending: !isDefined(destinations), handleRowSelect, handleCommit };
};
