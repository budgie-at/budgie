import { Trans } from '@lingui/react/macro';
import { ArrowRight, Code2, Download, Fingerprint, Github, Shield, Star, Users, WifiOff, Zap } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';

const initialMotionHeader = { opacity: 0, y: 20 };
const animatedMotionHeader = { opacity: 1, y: 0 };
const transitionMotionHeader = { duration: 0.5 };

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

        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-red-600 to-orange-500">
                <Trans>Quit Overspending.</Trans>
            </span>

            <br />

            <span className="bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                <Trans>Your Data Stays Yours.</Trans>
            </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            <Trans>
                The only budgeting app that works 100% offline. Your financial data never leaves your device—encrypted with your biometrics,
                open source for anyone to audit. Finally, a money app you can actually trust.
            </Trans>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button className="rounded-full h-14 px-10 text-lg font-semibold bg-linear-to-r from-primary to-primary/80" size="lg">
                <Download className="mr-2 size-5" />
                <Trans>Download Free</Trans>
                <ArrowRight className="ml-2 size-5" />
            </Button>

            <Button className="rounded-full h-14 px-10 text-lg bg-transparent" size="lg" variant="outline">
                <Github className="mr-2 size-5" />
                <Trans>View Source Code</Trans>
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
                    <Trans>(2,400+ reviews)</Trans>
                </span>
            </div>

            <div className="hidden sm:block w-px h-4 bg-border" />

            <div className="flex items-center gap-1.5">
                <Users className="size-4 text-primary" />

                <span>
                    <Trans>50K+ users</Trans>
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
                    <Trans>Blazing fast</Trans>
                </span>
            </div>
        </div>
    </Motion>
);
