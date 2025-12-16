import { EmptyFn } from '@rnw-community/shared';

export interface BottomSheetInterface<T = unknown> {
    open: (data?: T) => void;
    close: EmptyFn;
    dismiss: EmptyFn;
}
