'use client'

import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '../ui/badge';

import { HeroButtons } from './hero-buttons';
import { HeroPoints } from './hero-points';

export const HeroSection = () => (
    <section className="w-full py-20 md:py-32 lg:py-40 overflow-hidden">
        <div className="container py-6 px-4 md:px-6 relative">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

            <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-3xl mx-auto mb-12"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
            >
                <Badge className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    <Github className="size-3 mr-1" />
                    Open Source & Private
                </Badge>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Your Money, Your Privacy, Your Control
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Budgie is the offline-first expense tracker that keeps your financial data completely private. Track cash, crypto,
                    stocks, and bank accounts across multiple currencies—all stored securely on your device.
                </p>

                <HeroButtons />

                <HeroPoints />
            </motion.div>

            <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="relative mx-auto max-w-lg"
                initial={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.7, delay: 0.2 }}
            >
                <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">
                    <Image
                        alt="Budgie mobile app interface showing balance overview with multi-currency bank accounts including Monobank cards and various account types"
                        className="w-full h-auto"
                        height={720}
                        priority
                        src="/images/design-mode/photo_2025-09-26_21-57-24.jpg"
                        width={1280}
                    />

                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                </div>

                <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70" />

                <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70" />
            </motion.div>
        </div>
    </section>
);
