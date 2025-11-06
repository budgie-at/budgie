'use client';

import { MotionProps, motion } from 'framer-motion';
import React, { JSX } from 'react';

import { isDefined } from '@rnw-community/shared';

interface CustomMotionProps<Tag extends keyof JSX.IntrinsicElements> extends MotionProps {
    type?: Tag;
    children: React.ReactNode;
    className?: string;
    index?: number;
}

export const Motion = <Tag extends keyof JSX.IntrinsicElements = 'div'>(props: CustomMotionProps<Tag>) => {
    const {
        type,
        children,
        className,
        index,
        animate = { opacity: 1, y: 0 },
        transition = { duration: 0.5 },
        initial = { opacity: 0, y: 20 },
        viewport,
        whileInView,
        ...motionProps
    } = props;

    const indexTransition = isDefined(index) ? { duration: 0.5, ...transition, delay: index * 0.1 } : transition;
    const indexAnimate = isDefined(index) ? { opacity: 1, y: 0 } : animate;
    const indexInitial = isDefined(index) ? { opacity: 0, y: 20 } : initial;
    const indexViewport = isDefined(index) ? { once: true } : viewport;
    const indexWhileInView = isDefined(index) ? { opacity: 1, y: 0 } : whileInView;

    // @ts-expect-error Dynamic component
    const Component = (isDefined(type) ? motion[type] : motion.div) as typeof motion.div;

    return (
        <Component
            viewport={indexViewport}
            className={className}
            transition={indexTransition}
            animate={indexAnimate}
            initial={indexInitial}
            whileInView={indexWhileInView}
            {...motionProps}
        >
            {children}
        </Component>
    );
};
