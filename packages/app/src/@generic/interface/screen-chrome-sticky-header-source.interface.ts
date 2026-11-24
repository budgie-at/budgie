import type { ReactNode } from 'react';

export interface ScreenChromeStickyHeaderSourceInterface {
    readonly indices: readonly number[];
    readonly horizontalInset: number;
    readonly contentKey: unknown;
    readonly extraContentKey?: unknown;
    readonly renderHeader: (position: number) => ReactNode;
}
