'use client'

import { motion } from 'framer-motion';
import { Banknote, Layers, Shield, Target, TrendingUp, WifiOff } from 'lucide-react';

import { Badge } from '../ui/badge';

import { FeaturesCard } from './features-card';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const features = [
    {
        title: 'Offline-First Design',
        description: "Track expenses anywhere, anytime. Your data syncs when you're back online.",
        icon: <WifiOff className="size-5" />
    },
    {
        title: 'Bank Synchronization',
        description: 'Automatically import transactions from your bank accounts for effortless tracking.',
        icon: <Banknote className="size-5" />
    },
    {
        title: 'Multi-Asset Tracking',
        description: 'Monitor cash, crypto, stocks, and bank accounts all in one place.',
        icon: <Layers className="size-5" />
    },
    {
        title: 'Complete Privacy',
        description: 'Your financial data stays on your device. No cloud storage, no data mining.',
        icon: <Shield className="size-5" />
    },
    {
        title: 'Multi-Currency Support',
        description: 'Track expenses in any currency with real-time exchange rates.',
        icon: <TrendingUp className="size-5" />
    },
    {
        title: 'Goals & Debt Tracking',
        description: 'Set financial goals and track debt payments to achieve financial freedom.',
        icon: <Target className="size-5" />
    }
];

export const FeaturesSection = () => (
    <section className="w-full py-20 md:py-32" id="features">
        <div className="container px-4 md:px-6">
            <motion.div
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
            >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                    Features
                </Badge>

                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything You Need to Master Your Finances</h2>

                <p className="max-w-[800px] text-muted-foreground md:text-lg">
                    Budgie combines powerful expense tracking with complete privacy. Track every dollar, euro, or bitcoin while keeping your
                    financial data exactly where it belongs—on your device.
                </p>
            </motion.div>

            <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                variants={container}
                viewport={{ once: true }}
                whileInView="show"
            >
                {features.map(({ title, description, icon }) => (
                    <motion.div key={title} variants={item}>
                        <FeaturesCard description={description} icon={icon} title={title} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    </section>
);
