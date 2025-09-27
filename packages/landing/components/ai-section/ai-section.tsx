'use client'

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { Badge } from '../ui/badge';

import { AiDetails } from './ai-details';
import { AiFeatures } from './ai-features';

export const AiSection = () => (
    <section className="w-full py-20 md:py-32">
        <div className="container px-4 md:px-6">
            <motion.div
                className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    <Sparkles className="size-3 mr-1" />
                    AI Assistant
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Smart Financial Insights, Privately Powered</h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    Get instant answers about your spending with Budgie&apos;s on-device AI. No data leaves your phone—smart analysis
                    happens locally for complete privacy.
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, x: 0 }}
                >
                    <AiFeatures />
                </motion.div>

                <motion.div
                    className="relative"
                    initial={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, x: 0 }}
                >
                    <AiDetails />
                </motion.div>
            </div>
        </div>
    </section>
);
