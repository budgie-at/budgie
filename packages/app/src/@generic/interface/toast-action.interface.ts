import type { EmptyFn } from '@rnw-community/shared';

export interface ToastActionInterface {
    readonly label: string;
    readonly onPress: EmptyFn;
}
