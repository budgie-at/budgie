import { isDefined } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly className?: string;
    readonly index?: number;
}

export const Motion = ({ children, className, index }: Props) => {
    const animationClassName = isDefined(index) ? 'fade-in fade-in-view' : 'fade-in';
    const combinedClassName = isDefined(className) ? `${animationClassName} ${className}` : animationClassName;

    const style = { ...(isDefined(index) && { '--fade-in-index': index }) };

    return (
        <div className={combinedClassName} style={style}>
            {children}
        </div>
    );
};
