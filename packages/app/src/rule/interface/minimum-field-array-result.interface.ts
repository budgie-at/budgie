import type { EmptyFn } from '@rnw-community/shared';
import type { ArrayPath, FieldValues, UseFieldArrayReturn } from 'react-hook-form';

export interface MinimumFieldArrayResultInterface<T extends FieldValues, N extends ArrayPath<T>> extends UseFieldArrayReturn<T, N> {
    readonly canRemove: boolean;
    readonly safeRemove: (index: number) => void;
    readonly add: EmptyFn;
}
