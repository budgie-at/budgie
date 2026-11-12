/* eslint-disable max-lines-per-function */
import { Trans } from '@lingui/react/macro';
import { Eye, Lock, Users } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureVersus } from '../../../../feature/component/feature-versus/feature-versus';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function FamilySharingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Budget together, share only what you choose</Trans>}
                tagline={
                    <Trans>
                        Share chosen accounts and budgets with your partner or family through iCloud. They can see and edit what you share.
                        Everything else stays private. Available on iPhone and iPad.
                    </Trans>
                }
            />

            <FeatureSpecTiles heading={<Trans>Your money, your rules</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>you decide what is shared</Trans>} value={<Trans>Your pick</Trans>}>
                    <Trans>Share every account, or only the accounts and budgets you choose.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>what your family can do with it</Trans>} value={<Trans>See and edit</Trans>}>
                    <Trans>Family members can see and edit the accounts you share.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>everything you do not share</Trans>} value={<Trans>Private</Trans>}>
                    <Trans>Accounts and budgets you leave out never reach anyone else.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureVersus
                heading={<Trans>Two ways to budget as a couple</Trans>}
                lede={<Trans>Sharing money does not have to mean sharing everything.</Trans>}
            >
                <FeatureVersus.Without title={<Trans>One shared login</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>Your partner sees every account</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Personal spending mixes with household spending</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>A shared password to manage</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Your data sits on someone else&apos;s server</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.Without>
                <FeatureVersus.With title={<Trans>Choose what to share</Trans>}>
                    <FeatureVersus.Item>
                        <Trans>You pick accounts and budgets one by one</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Your other accounts stay private</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Everyone keeps their own Apple ID</Trans>
                    </FeatureVersus.Item>
                    <FeatureVersus.Item>
                        <Trans>Shared data travels through iCloud</Trans>
                    </FeatureVersus.Item>
                </FeatureVersus.With>
            </FeatureVersus>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Users} title={<Trans>Invite with Messages</Trans>}>
                    <Trans>Open Settings, then Family, and send an invitation with Messages. Each link works for one person.</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Eye} title={<Trans>A Family section on Home</Trans>}>
                    <Trans>
                        Shared accounts appear in their own Family section, grouped by bank and by account type. It shows the family total
                        and says the money is shared with you, not counted in your total.
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Lock} title={<Trans>Private stays private</Trans>}>
                    <Trans>
                        Only what you choose to share is visible to your family. Your own accounts never show up in the Family section.
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Turn on Share all your accounts, which also covers accounts you add later</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Or pick accounts one at a time, grouped by bank and account type</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Share a budget with family; it counts spending from shared accounts only</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>See who is the organizer, who has joined and who is still waiting</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item title={<Trans>How sharing works</Trans>}>
                    <p>
                        <Trans>
                            Sharing uses your own iCloud. Turn on Sync across devices, open Settings, then Family, and tap Invite family.
                            Send the invitation with Messages. Your partner opens the link on their iPhone or iPad and joins. Budgie has no
                            server of its own and no account to create.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Then choose what to share: all your accounts, or specific accounts and budgets. Family members can see and edit
                            what you share. If you are signed out of iCloud, sharing pauses and balances may be out of date until you sign
                            in again.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item title={<Trans>Leaving and stopping</Trans>}>
                    <p>
                        <Trans>
                            A member can leave at any time and keeps a copy of the shared data in their own accounts on that device. Later
                            changes by the family no longer reach them.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            The organizer can remove a person or stop sharing. When sharing stops, everyone is removed from the family group
                            and their shared data is deleted from their devices the next time they sync. A device that is offline may keep
                            it until then. The organizer keeps their own data.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    question={<Trans>Can my partner see all my accounts?</Trans>}
                    answer={
                        <Trans>No. Your partner sees only the accounts and budgets you share. Everything else stays private to you.</Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Can family members edit shared accounts?</Trans>}
                    answer={
                        <Trans>
                            Yes. Family members can see and edit the accounts you share, and everyone sees the changes after sync.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>How do I invite someone?</Trans>}
                    answer={
                        <Trans>
                            Open Settings, then Family, and tap Invite family. Send the invitation with Messages. Each link works for one
                            person, and you see who has joined and who is still waiting.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>What happens when I leave or stop sharing?</Trans>}
                    answer={
                        <Trans>
                            If you leave, you keep a copy of the shared data in your own accounts. If the organizer stops sharing, everyone
                            is removed and their shared data is deleted from their devices at their next sync. The organizer keeps their
                            data.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    question={<Trans>Does family sharing work on Android?</Trans>}
                    answer={<Trans>No. Family sharing runs through iCloud, so it is available on iPhone and iPad only.</Trans>}
                />
                <FeatureFaq.Item
                    question={<Trans>Does anyone besides my family see my data?</Trans>}
                    answer={
                        <Trans>
                            No. Shared data goes through iCloud and Budgie runs no server and keeps no copy. See the privacy page for
                            details.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
