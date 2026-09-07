import { Trans } from '@lingui/react/macro';

import { FEATURE_REGISTRY } from '../../constant/feature-registry.constant';
import { FeatureTierEnum } from '../../constant/feature-tier.enum';
import { FeaturesHubTierSection } from '../features-hub-tier-section/features-hub-tier-section';

interface Props {
    readonly locale: string;
}

export const FeaturesHubGrid = ({ locale }: Props) => (
    <div className="space-y-12">
        <FeaturesHubTierSection features={FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.HERO)} locale={locale}>
            <Trans>Headline Features</Trans>
        </FeaturesHubTierSection>
        <FeaturesHubTierSection features={FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.CORE)} locale={locale}>
            <Trans>Core Features</Trans>
        </FeaturesHubTierSection>
        <FeaturesHubTierSection features={FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.POWER)} locale={locale}>
            <Trans>Power-User Features</Trans>
        </FeaturesHubTierSection>
        <FeaturesHubTierSection features={FEATURE_REGISTRY.filter(feature => feature.tier === FeatureTierEnum.NICHE)} locale={locale}>
            <Trans>More Features</Trans>
        </FeaturesHubTierSection>
    </div>
);
