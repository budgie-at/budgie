import type { Dispatch, SetStateAction } from 'react';

export interface HostAccessibilityInterface {
    readonly openCount: number;
    readonly setOpenCount: Dispatch<SetStateAction<number>>;
}
