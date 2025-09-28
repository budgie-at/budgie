'use client'

import { motion } from 'framer-motion';

import { WhitelistOffer } from './whitelist-offer';

export const WhitelistSection = () => (
    <section
        className="w-full py-20 md:py-32 bg-linear-to-br from-primary/5 via-primary/10 to-secondary/5 relative overflow-hidden"
        id="whitelist"
    >
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" />

        <div className="container px-4 md:px-6 relative">
            <motion.div
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                <WhitelistOffer />
            </motion.div>
        </div>
    </section>
);
