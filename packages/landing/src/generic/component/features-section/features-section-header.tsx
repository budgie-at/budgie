import { Trans } from '@lingui/react/macro';
import { Wallet } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const FeaturesSectionHeader = () => (
    <Motion
        className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
        initial={initialMotion}
        transition={transitionMotion}
        viewport={viewportOnce}
        whileInView={animatedMotion}
    >
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            <Wallet className="size-3 mr-1" />
            <Trans>All-in-One</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl">
            <Trans>Every Dollar. Every Account. One App.</Trans>
        </h2>

        <p className="max-w-[800px] text-muted-foreground md:text-lg">
            <Trans>
                Stop switching between apps. Budgie tracks your bank accounts, credit cards, cash, crypto, and investments together—so you
                finally see the complete picture of your finances.
            </Trans>
        </p>
    </Motion>
);
