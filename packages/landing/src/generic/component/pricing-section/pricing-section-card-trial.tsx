import { Trans } from '@lingui/react/macro';

import { Button } from '../../../ui/button';

import { PricingSectionCard } from './pricing-section-card';
import { PricingSectionFeature } from './pricing-section-feature';

export const PricingSectionCardTrial = () => (
    <PricingSectionCard
        button={
            <Button className="w-full rounded-full" variant="outline">
                <Trans>Start Free Trial</Trans>
            </Button>
        }
        features={
            <>
                <PricingSectionFeature>
                    <Trans>All features included</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>No credit card required</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>Unlimited accounts</Trans>
                </PricingSectionFeature>
            </>
        }
        price="$0"
        priceSuffix={<Trans>/14 days</Trans>}
        subtitle={<Trans>Try everything risk-free</Trans>}
        title={<Trans>Free Trial</Trans>}
    />
);
