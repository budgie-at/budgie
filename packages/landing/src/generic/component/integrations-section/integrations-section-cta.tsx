import { Trans } from '@lingui/react/macro';
import { ArrowRight } from 'lucide-react';

import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';

const ctaInitial = { opacity: 0 };
const ctaAnimate = { opacity: 1 };
const ctaTransition = { duration: 0.5, delay: 0.3 };
const viewportOnce = { once: true };

export const IntegrationsSectionCta = () => (
    <Motion className="text-center mt-12" initial={ctaInitial} transition={ctaTransition} viewport={viewportOnce} whileInView={ctaAnimate}>
        <Button className="rounded-full h-12 px-8" size="lg" variant="outline">
            <Trans>View All Integrations</Trans>
            <ArrowRight className="ml-2 size-4" />
        </Button>
    </Motion>
);
