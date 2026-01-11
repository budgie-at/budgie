import { Trans } from '@lingui/react/macro';
import { ArrowRight, Download, Github, Shield, Smartphone, Star, TrendingDown, Users, Wallet } from 'lucide-react';

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
            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                <TrendingDown className="size-3 mr-1" />
                <Trans>Stop Overspending</Trans>
            </Badge>

            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                <Wallet className="size-3 mr-1" />
                <Trans>All Finances in One App</Trans>
            </Badge>

            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                <Shield className="size-3 mr-1" />
                <Trans>100% Private</Trans>
            </Badge>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-red-600 to-orange-500">
                <Trans>Quit Overspending.</Trans>
            </span>

            <br />

            <span className="bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                <Trans>Take Control Today.</Trans>
            </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            <Trans>
                See exactly where your money goes. Track cash, cards, crypto, and investments in one private app. No more wondering why your
                balance is low—Budgie shows you the truth about your spending.
            </Trans>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button className="rounded-full h-14 px-10 text-lg font-semibold bg-linear-to-r from-primary to-primary/80" size="lg">
                <Download className="mr-2 size-5" />
                <Trans>Start Saving Now</Trans>
                <ArrowRight className="ml-2 size-5" />
            </Button>

            <Button className="rounded-full h-14 px-10 text-lg bg-transparent" size="lg" variant="outline">
                <Github className="mr-2 size-5" />
                <Trans>View Source</Trans>
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
                    <Trans>50K+ users saving money</Trans>
                </span>
            </div>

            <div className="hidden sm:block w-px h-4 bg-border" />

            <div className="flex items-center gap-1.5">
                <Smartphone className="size-4 text-green-500" />

                <span>
                    <Trans>No account needed</Trans>
                </span>
            </div>
        </div>
    </Motion>
);
