import { Trans } from '@lingui/react/macro';
import { ArrowRight, Crown } from 'lucide-react';

import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';

import { PricingSectionCard } from './pricing-section-card';
import { PricingSectionFeature } from './pricing-section-feature';

export const PricingSectionCardAnnual = () => (
    <PricingSectionCard
        badge={
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="rounded-full px-3 py-1 bg-primary text-primary-foreground">
                    <Crown className="size-3 mr-1" />
                    <Trans>Most Popular</Trans>
                </Badge>
            </div>
        }
        button={
            <Button className="w-full rounded-full">
                <Trans>Get Started</Trans>
                <ArrowRight className="ml-2 size-4" />
            </Button>
        }
        delay={0.1}
        features={
            <>
                <PricingSectionFeature>
                    <Trans>Unlimited bank syncs</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>AI-powered insights</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>Multi-currency support</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>Priority support</Trans>
                </PricingSectionFeature>
                <PricingSectionFeature>
                    <Trans>30-day money-back guarantee</Trans>
                </PricingSectionFeature>
            </>
        }
        highlight
        price="$16"
        priceNote={<Trans>Billed annually ($192/year) — Save 20%</Trans>}
        priceSuffix={<Trans>/month</Trans>}
        subtitle={<Trans>Best value for power users</Trans>}
        title={<Trans>Annual</Trans>}
    />
);
