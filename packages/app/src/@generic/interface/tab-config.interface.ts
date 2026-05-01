import type { ReactNode } from 'react';

export interface TabConfigInterface<T extends string> {
    readonly key: T;
    readonly label: ReactNode;
    readonly testID: string;
}
