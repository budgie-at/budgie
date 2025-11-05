'use client'

import { motion } from 'framer-motion';

import { CtaDetails } from './cta-details';

const initialMotion = { opacity: 0, y: 20 };
const transitionMotion = { duration: 0.5 };
const viewportMotion = { once: true };
const whileInViewMotion = { opacity: 1, y: 0 };

export const CtaSection = () => (
    <section className="w-full py-20 md:py-32 bg-linear-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-size-[4rem_4rem]" />

        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="container px-4 md:px-6 relative">
            <motion.div
                className="flex flex-col items-center justify-center space-y-6 text-center"
                initial={initialMotion}
                transition={transitionMotion}
                viewport={viewportMotion}
                whileInView={whileInViewMotion}
            >
                <CtaDetails />
            </motion.div>
        </div>
    </section>
);
