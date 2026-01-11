import { Trans } from '@lingui/react/macro';
import { Zap } from 'lucide-react';

import { Motion } from '../motion/motion';

const viewportOnce = { once: true };
const ctaInitial = { opacity: 0 };
const ctaAnimate = { opacity: 1 };
const ctaTransition = { duration: 0.5, delay: 0.3 };

export const PricingSectionCta = () => (
    <Motion className="text-center mt-12" initial={ctaInitial} transition={ctaTransition} viewport={viewportOnce} whileInView={ctaAnimate}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <Zap className="size-4" />

            <span className="text-sm font-medium">
                <Trans>Early adopter? Join the whitelist and get 25% off your first year!</Trans>
            </span>
        </div>
    </Motion>
);
