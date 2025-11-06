import { Trans, useLingui } from '@lingui/react/macro';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';

import { AiSectionFeaturesItem } from '../ai-section-features-item/ai-section-features-item';

export const AiSectionFeatures = () => {
    const { t } = useLingui();

    return (
        <>
            <div className="space-y-6">
                <AiSectionFeaturesItem
                    content={t`Ask questions like "Why is there so little money?" and get detailed breakdowns of your spending patterns, unusual transactions, and budget insights.`}
                    icon={<Sparkles className="size-5" />}
                    title={t`Instant Financial Analysis`}
                />

                <AiSectionFeaturesItem
                    content={t`Your financial data never leaves your device. The AI runs locally, ensuring your spending habits and financial questions remain completely private.`}
                    icon={<Shield className="size-5" />}
                    title={t`100% On-Device Processing`}
                />

                <AiSectionFeaturesItem
                    content={t`Get personalized recommendations like "Don\'t give a girl so much money!" and other practical insights to help you make better financial decisions.`}
                    icon={<TrendingUp className="size-5" />}
                    title={t`Smart Spending Advice`}
                />
            </div>

            <div className="p-6 bg-muted/50 rounded-xl border border-border/40">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <Trans>Example AI Conversations</Trans>
                </h4>

                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="text-muted-foreground">
                            <Trans>You:</Trans>
                        </div>

                        <div>
                            <Trans>&quot;Why did I spend so much this month?&quot;</Trans>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="text-primary font-medium">
                            <Trans>AI:</Trans>
                        </div>

                        <div className="text-muted-foreground">
                            <Trans>
                                &quot;You spent 40% more on dining out ($320 vs $230 average). Your largest expense was $85 at Fancy
                                Restaurant on the 15th.&quot;
                            </Trans>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
