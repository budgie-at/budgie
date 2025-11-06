import { Trans, useLingui } from '@lingui/react/macro';
import { ArrowRight, Check, Clock, Shield, Sparkles } from 'lucide-react';

import { Button } from '../../../ui/button';
import { WhitelistSectionOfferBenefit } from '../whitelist-section-offer-benefit/whitelist-section-offer-benefit';

// eslint-disable-next-line max-lines-per-function
export const WhitelistSectionOffer = () => {
    const { t } = useLingui();

    return (
        <div className="text-center space-y-6">
            <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary">
                    <Trans>Join the Whitelist & Save 25%</Trans>
                </h2>

                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    <Trans>
                        Be among the first to experience Budgie Pro with exclusive early access pricing. Limited spots available for
                        privacy-conscious early adopters.
                    </Trans>
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-8">
                <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                        <Trans>Regular Price</Trans>
                    </div>

                    <div className="text-3xl font-bold text-muted-foreground line-through">
                        <Trans>$20/month</Trans>
                    </div>
                </div>

                <div className="hidden sm:block text-4xl text-primary">→</div>

                <div className="text-center">
                    <div className="text-sm text-primary font-medium mb-2">
                        <Trans>Whitelist Price</Trans>
                    </div>

                    <div className="text-4xl md:text-5xl font-bold text-primary">
                        <Trans>$15/month</Trans>
                    </div>

                    <div className="text-sm text-primary font-medium">
                        <Trans>25% off for the first year</Trans>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 py-6">
                <WhitelistSectionOfferBenefit
                    description={t`Get Budgie Pro before the public launch`}
                    icon={<Clock className="size-6" />}
                    title={t`Early Access`}
                />

                <WhitelistSectionOfferBenefit
                    description={t`25% off your first year of Budgie Pro`}
                    icon={<Sparkles className="size-6" />}
                    title={t`First Year Discount`}
                />

                <WhitelistSectionOfferBenefit
                    description={t`Direct line to our development team`}
                    icon={<Shield className="size-6" />}
                    title={t`Priority Support`}
                />
            </div>

            <div className="space-y-4">
                <Button
                    className="w-full sm:w-auto rounded-full h-14 px-12 text-lg bg-linear-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
                    size="lg"
                >
                    <Trans>Join Whitelist - Save 25%</Trans>
                    <ArrowRight className="ml-2 size-5" />
                </Button>

                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Check className="size-4 text-primary" />

                        <span>
                            <Trans>No commitment</Trans>
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Check className="size-4 text-primary" />

                        <span>
                            <Trans>Cancel anytime</Trans>
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Check className="size-4 text-primary" />

                        <span>
                            <Trans>Limited time</Trans>
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border/40">
                <p className="text-sm text-muted-foreground">
                    <Trans>
                        <strong className="text-foreground">Limited Offer:</strong> Only 500 whitelist spots available. Get 25% off your
                        first year of Budgie Pro when you join the whitelist.
                    </Trans>
                </p>
            </div>
        </div>
    );
};
