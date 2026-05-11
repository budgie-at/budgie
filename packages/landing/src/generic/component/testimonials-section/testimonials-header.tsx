import { Trans } from '@lingui/react/macro';
import { TrendingUp } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const TestimonialsHeader = () => (
    <Motion
        className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
        initial={initialMotion}
        transition={transitionMotion}
        viewport={viewportOnce}
        whileInView={animatedMotion}
    >
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
            <TrendingUp className="size-3 mr-1" />
            <Trans>Beta Tester Feedback</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            <Trans>What Beta Testers Are Saying</Trans>
        </h2>

        <p className="max-w-[800px] text-muted-foreground md:text-lg">
            <Trans>Quotes from anonymized beta tester feedback. Names and locations have been changed to protect privacy.</Trans>
        </p>
    </Motion>
);
