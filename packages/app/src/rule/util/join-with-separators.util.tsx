import { t } from '@lingui/core/macro';
import { Fragment, type ReactNode } from 'react';

export const joinWithSeparators = (parts: ReactNode[]): ReactNode[] => {
    const joined: ReactNode[] = [];
    const andSeparator = ` ${t`and`} `;

    for (const [index, part] of parts.entries()) {
        if (index > 0) {
            const separator = index < parts.length - 1 ? ', ' : andSeparator;
            joined.push(<Fragment key={`sep-${index}`}>{separator}</Fragment>);
        }
        joined.push(part);
    }

    return joined;
};
