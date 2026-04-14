import { Trans } from '@lingui/react/macro';
import { Code2, Fingerprint, Github, Shield, Smartphone, Star, WifiOff, Zap } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';
import { WaitlistForm } from '../waitlist-form/waitlist-form';

const initialMotionHeader = { opacity: 0, y: 20 };
const animatedMotionHeader = { opacity: 1, y: 0 };
const transitionMotionHeader = { duration: 0.5 };

// eslint-disable-next-line max-lines-per-function -- Landing hero with badges, heading, form, and trust indicators
export const HeroSectionHeader = () => (
    <Motion
        animate={animatedMotionHeader}
        className="text-center max-w-4xl mx-auto mb-12"
        initial={initialMotionHeader}
        transition={transitionMotionHeader}
    >
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                <WifiOff className="size-3 mr-1" />
                <Trans>100% Offline</Trans>
            </Badge>

            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                <Fingerprint className="size-3 mr-1" />
                <Trans>Biometric Encrypted</Trans>
            </Badge>

            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                <Code2 className="size-3 mr-1" />
                <Trans>Open Source</Trans>
            </Badge>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                <Trans>Your Financial Data.</Trans>
            </span>

            <br />

            <span className="bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                <Trans>Your Device.</Trans>
            </span>

            <br />

            <span className="bg-clip-text text-transparent bg-linear-to-r from-green-600 to-emerald-500">
                <Trans>Your Rules.</Trans>
            </span>
        </h1>

        <p className="text-base md:text-lg font-medium text-muted-foreground/80 mb-4">
            <Trans>The privacy-first offline expense tracker — open source budget app for iOS &amp; Android.</Trans>
        </p>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            <Trans>
                Your bank knows everything. Mint sold your data. YNAB stores it on their servers. Budgie keeps your finances on your
                device—encrypted, offline, and yours alone.
            </Trans>
        </p>

        <div className="flex flex-col items-center gap-6 mb-8">
            <WaitlistForm initialCount={2847} variant="hero" />

            <Button asChild className="rounded-full h-12 px-8 text-base bg-transparent hidden md:flex" size="lg" variant="outline">
                {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
                <Link href="https://github.com/budgie-at/budgie" rel="noopener noreferrer" target="_blank">
                    <Github className="mr-2 size-4" />
                    <Trans>View Source Code</Trans>
                </Link>
            </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
                <div className="flex">
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                </div>

                <span className="font-medium">4.9/5</span>

                <span className="text-muted-foreground/60">
                    <Trans>(Beta testers)</Trans>
                </span>
            </div>

            <div className="hidden sm:block w-px h-4 bg-border" />

            <div className="flex items-center gap-1.5">
                <Smartphone className="size-4 text-primary" />

                <span>
                    <Trans>iOS & Android</Trans>
                </span>
            </div>

            <div className="hidden sm:block w-px h-4 bg-border" />

            <div className="flex items-center gap-1.5">
                <Shield className="size-4 text-green-500" />

                <span>
                    <Trans>Zero data collection</Trans>
                </span>
            </div>

            <div className="hidden sm:block w-px h-4 bg-border" />

            <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-orange-500" />

                <span>
                    <Trans>Works without internet</Trans>
                </span>
            </div>
        </div>
    </Motion>
);
