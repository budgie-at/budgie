import { Trans } from '@lingui/react/macro';
import { Check, Shield, Zap } from 'lucide-react';

import { Motion } from '../motion/motion';

const initialMotionBadges = { opacity: 0, y: 20 };
const animatedMotionBadges = { opacity: 1, y: 0 };
const transitionMotionBadges = { duration: 0.5, delay: 0.4 };

export const HeroSectionBadges = () => (
    <Motion
        animate={animatedMotionBadges}
        className="flex flex-wrap items-center justify-center gap-4 mt-12"
        initial={initialMotionBadges}
        transition={transitionMotionBadges}
    >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/40">
            <Zap className="size-4 text-orange-500" />

            <span className="text-sm font-medium">
                <Trans>Instant Spending Insights</Trans>
            </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/40">
            <Check className="size-4 text-green-500" />

            <span className="text-sm font-medium">
                <Trans>Bank, Crypto & Cash</Trans>
            </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/40">
            <Check className="size-4 text-green-500" />

            <span className="text-sm font-medium">
                <Trans>Works Offline</Trans>
            </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/40">
            <Shield className="size-4 text-primary" />

            <span className="text-sm font-medium">
                <Trans>Your Data Stays Yours</Trans>
            </span>
        </div>
    </Motion>
);
