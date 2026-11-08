import type { ReactNode } from 'react';

export interface LockstepStackActionsInterface {
    readonly push: (key: string, content: ReactNode, onClose?: () => void) => void;
    readonly pop: () => void;
}
