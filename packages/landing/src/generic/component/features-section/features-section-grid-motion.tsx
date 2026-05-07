'use client';

import { Motion } from '../motion/motion';

import type { ReactNode } from 'react';


const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const viewportOnce = { once: true };

interface Props {
    readonly children: ReactNode;
}

export const FeaturesSectionGridMotion = ({ children }: Props) => (
    <Motion
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        initial="hidden"
        variants={containerVariants}
        viewport={viewportOnce}
        whileInView="show"
    >
        {children}
    </Motion>
);
