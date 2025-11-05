'use client';

import { MotionProps, motion } from 'framer-motion';
import React, { JSX } from 'react';

import { isDefined } from '@rnw-community/shared';

interface CustomMotionProps<Tag extends keyof JSX.IntrinsicElements> extends MotionProps {
    type?: Tag;
    children: React.ReactNode;
    className?: string;
}

export const Motion = <Tag extends keyof JSX.IntrinsicElements = 'div'>({
    type,
    children,
    className,
    ...props
}: CustomMotionProps<Tag>) => {
    // @ts-expect-error Dynamic component
    const Component = (isDefined(type) ? motion[type] : motion.div) as typeof motion.div;

    return (
        <Component className={className} {...props}>
            {children}
        </Component>
    );
};
