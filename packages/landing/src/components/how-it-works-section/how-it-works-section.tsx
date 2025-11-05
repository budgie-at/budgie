'use client'

import { motion } from 'framer-motion';

import { Badge } from '../ui/badge';

const steps = [
    {
        step: '01',
        title: 'Download & Install',
        description: 'Get Budgie from the app store. No registration required—your privacy starts immediately.'
    },
    {
        step: '02',
        title: 'Connect Your Accounts',
        description: 'Securely link your bank accounts, crypto wallets, and investment accounts for automatic tracking.'
    },
    {
        step: '03',
        title: 'Track Everything',
        description: 'Monitor expenses, set goals, track debts, and gain insights—all while keeping your data private.'
    }
];

export const HowItWorksSection = () => (
    <section className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]" />

        <div className="container px-4 md:px-6 relative">
            <motion.div
                className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    How It Works
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Start Tracking in Minutes</h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    Get complete control over your finances with just a few simple steps. No accounts, no cloud storage, no compromises.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />

                {steps.map((step, index) => (
                    <motion.div
                        className="relative z-10 flex flex-col items-center text-center space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        key={step.title}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileInView={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg">
                            {step.step}
                        </div>

                        <h3 className="text-xl font-bold">{step.title}</h3>

                        <p className="text-muted-foreground">{step.description}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);
