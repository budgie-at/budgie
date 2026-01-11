import { Trans } from '@lingui/react/macro';
import { Sparkles } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const PricingSectionHeader = () => (
    <Motion
        className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
        initial={initialMotion}
        transition={transitionMotion}
        viewport={viewportOnce}
        whileInView={animatedMotion}
    >
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            <Sparkles className="size-3 mr-1" />
            <Trans>Simple Pricing</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            <Trans>One Plan, Everything Included</Trans>
        </h2>

        <p className="max-w-[800px] text-muted-foreground md:text-lg">
            <Trans>No hidden fees, no feature restrictions. Get full access to all features with a simple, transparent price.</Trans>
        </p>
    </Motion>
);
