import { Trans } from '@lingui/react/macro';

import { Badge } from '../../../ui/badge';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

export const ComparisonSectionHeader = () => (
    <Motion
        className="text-center mb-16"
        initial={initialMotion}
        transition={transitionMotion}
        viewport={viewportOnce}
        whileInView={animatedMotion}
    >
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium mb-6" variant="secondary">
            <Trans>Honest Comparison</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            <Trans>See How We Compare</Trans>
        </h2>

        <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto">
            <Trans>We believe in transparency. Here&apos;s an honest comparison with other popular budgeting apps.</Trans>
        </p>
    </Motion>
);
