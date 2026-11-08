import type { ReactNode } from 'react';

export interface LockstepStackScreenInterface {
    readonly key: string;
    readonly content: ReactNode;
    readonly onClose: (() => void) | undefined;
}
