import { Trans } from '@lingui/react/macro';

import { Button } from '../../../ui/button';

import { PricingSectionCard } from './pricing-section-card';
import { PricingSectionFeature } from './pricing-section-feature';

export const PricingSectionCardMonthly = () => (
    <PricingSectionCard
        button={
            <Button className="w-full rounded-full" variant="outline">
                <Trans>Get Started</Trans>
            </Button>
        }
        delay={0.2}
        features={
            <>
                <PricingSectionFeature>
                    <Trans>All annual features</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>No commitment</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>Cancel anytime</Trans>
                </PricingSectionFeature>
            </>
        }
        price="$20"
        priceSuffix={<Trans>/month</Trans>}
        subtitle={<Trans>Flexible, cancel anytime</Trans>}
        title={<Trans>Monthly</Trans>}
    />
);
