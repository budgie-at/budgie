import type { ReactNode } from 'react';

export interface TransMessagePropsInterface {
    readonly id?: string;
    readonly message?: string;
    readonly children?: ReactNode;
}
