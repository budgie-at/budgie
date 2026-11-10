import { Children, cloneElement, isValidElement } from 'react';

import type { ReactElement, ReactNode } from 'react';

interface IndexedProps {
    readonly index?: number;
}

export const assignPositionIndex = (children: ReactNode, itemTypes: readonly unknown[]): ReactNode[] => {
    let position = 0;

    return Children.toArray(children).map(child => {
        if (!isValidElement<IndexedProps>(child) || !itemTypes.includes(child.type)) {
            return child;
        }

        const indexed: ReactElement<IndexedProps> = cloneElement(child, { index: position });

        position += 1;

        return indexed;
    });
};
