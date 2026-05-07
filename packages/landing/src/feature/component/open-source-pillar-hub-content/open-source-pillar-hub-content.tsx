import { Trans } from '@lingui/react/macro';

import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageProse } from '../feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

export const OpenSourcePillarHubContent = () => (
    <>
        <FeaturePageSection>
            <FeaturePageHeading>
                <Trans>Read the Code, Verify the Claims</Trans>
            </FeaturePageHeading>
            <FeaturePageProse>
                <Trans>
                    Budgie uses a source-available license that allows you to view, modify, and contribute to the code while ensuring only
                    we can monetize the official app. This keeps the project sustainable while maintaining transparency.
                </Trans>
            </FeaturePageProse>
            <FeaturePageProse>
                <Trans>
                    The repository includes the full React Native app, the AI service layer with on-device LLM and embedding model
                    integrations, the contracts package, and this landing page. Nothing is hidden behind a proprietary SDK or closed binary.
                </Trans>
            </FeaturePageProse>
        </FeaturePageSection>

        <FeaturePageSection>
            <FeaturePageHeading>
                <Trans>Source-Available License — No Lock-In</Trans>
            </FeaturePageHeading>
            <FeaturePageProse>
                <Trans>
                    Budgie ships under a source-available license that lets you read every line, fork it, and run your own build. Your
                    financial data belongs to you — not to a vendor who can change terms, raise prices, or shut down. If Budgie ever stops
                    meeting your needs, you take your data and your build with you.
                </Trans>
            </FeaturePageProse>
            <FeaturePageProse>
                <Trans>
                    Contributing is straightforward: open an issue, discuss the change, and submit a pull request. Features requested by
                    real users and built by real users have a direct path into the app without a gatekeeper commercial roadmap.
                </Trans>
            </FeaturePageProse>
        </FeaturePageSection>

        <FeaturePageSection>
            <FeaturePageHeading>
                <Trans>Transparency as a Security Property</Trans>
            </FeaturePageHeading>
            <FeaturePageProse>
                <Trans>
                    Public source is not just a development philosophy — it is a security property. Closed finance apps ask you to trust
                    that they do not log your transactions, share data with advertisers, or sell behavioral profiles. Budgie asks you to
                    check. The on-device architecture, AES-256 encryption, and zero-telemetry design are all visible in the repository for
                    any developer to verify.
                </Trans>
            </FeaturePageProse>
        </FeaturePageSection>
    </>
);
