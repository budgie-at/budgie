import { useEffect, useRef } from 'react';

import { useKeypadInput } from './use-keypad-input.hook';

import type { UseKeypadInputResult } from './use-keypad-input.hook';
import type { UseSplitEntriesReturn } from './use-split-entries.hook';

export const useSplitKeypadSync = (split: UseSplitEntriesReturn): UseKeypadInputResult => {
    const splitKeypad = useKeypadInput({
        initialValue: 0,
        onChange: (value: number) => {
            if (split.isSplitMode) {
                split.updateEntryAmount(split.activeEntryIndex, value);
            }
        }
    });

    const previousActiveEntryIndex = useRef(split.activeEntryIndex);
    const splitSetFromNumeric = splitKeypad.setFromNumeric;

    useEffect(() => {
        if (previousActiveEntryIndex.current !== split.activeEntryIndex) {
            const entryAmount = split.entries[split.activeEntryIndex]?.amount ?? 0;
            splitSetFromNumeric(entryAmount);
            previousActiveEntryIndex.current = split.activeEntryIndex;
        }
    }, [split.activeEntryIndex, split.entries, splitSetFromNumeric]);

    return splitKeypad;
};
