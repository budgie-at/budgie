/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildFeaturePageMetadata({
        locale: lang,
        slug: FEATURE_METADATA.slug,
        title: i18n._(FEATURE_METADATA.metaTitle),
        description: i18n._(FEATURE_METADATA.metaDescription),
        keywords: FEATURE_METADATA.seoKeywords.join(', '),
        publishedAt: FEATURE_METADATA.publishedAt,
        updatedAt: FEATURE_METADATA.updatedAt
    });
}

export default async function BiometricAuthenticationFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const description = i18n._(FEATURE_METADATA.metaDescription);
    const featureName = i18n._(FEATURE_METADATA.title);
    const title = i18n._(FEATURE_METADATA.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${FEATURE_METADATA.slug}`;

    return (
        <main className="flex-1">
            <FeaturePageBreadcrumbsJsonLd locale={lang} slug={FEATURE_METADATA.slug}>
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={homePath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={featuresPath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={featurePath} />
            </FeaturePageBreadcrumbsJsonLd>
            <FeaturePageWebPageJsonLd
                description={description}
                featureName={featureName}
                locale={lang}
                publishedAt={FEATURE_METADATA.publishedAt}
                slug={FEATURE_METADATA.slug}
                title={title}
                updatedAt={FEATURE_METADATA.updatedAt}
            />
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Face ID / Touch ID Authentication</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        One glance past Budgie&apos;s lock screen. The four digits you chose stay the key your database is encrypted with.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Face ID opens the lock, the PIN owns the key</Trans>}>
                    <Trans>
                        Biometric unlock is a shortcut past Budgie&apos;s lock screen. What encrypts the database underneath is still the
                        four-digit PIN.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>
                        The switch lives inside the App Lock card in Settings, under Security. It only appears once you have set a PIN and
                        the device has a biometric enrolled — there is no biometric-only mode.
                    </Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen with the Security section showing an App Lock card that reads Secure your app with PIN and Face ID`}
                    index={0}
                    locale={lang}
                    priority
                    scene="screenshot-protection-1"
                    slug="screenshot-protection"
                >
                    <FeatureStory.Callout y={0.42}>
                        <Trans>App Lock: PIN and Face ID</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        On a cold launch Budgie asks the system to authenticate you the moment the lock screen appears, and a successful
                        scan takes you straight in. The keypad also keeps a scan button, so you can ask for it again.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        Cancel or fail and nothing is lost: the keypad was already there. Budgie switches the device-passcode fallback off
                        on purpose, so your PIN is the only other way in.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why biometrics belong on a finance app you check ten times a day</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Biometrics are the right balance for an expense app you open ten times a day. Budgie calls the system authentication
                        API, so the matching happens in the operating system and Budgie only ever learns whether it succeeded.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Turned off, unavailable, cancelled or refused — every one of those paths lands on the PIN keypad, because the keypad
                        is what the lock screen renders in the first place. Budgie asks the system not to offer the device passcode as a
                        fallback, so your Budgie PIN is the only alternative.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Face ID unlock on the lock screen, offered when the device has it enrolled</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>The operating system does the matching — Budgie never sees biometric data, only the result</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Falls back to PIN if biometrics are disabled or unavailable</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>The device-passcode fallback is switched off on purpose — your PIN is the only alternative</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>The prompt fires by itself as the lock screen appears — no extra tap at app open</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie store my biometric data?</Trans>}
                    answer={
                        <Trans>
                            No. The operating system manages biometric matching and hands Budgie nothing but the result. There is no key
                            fragment and no biometric material on Budgie&apos;s side — the encryption key is your PIN.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if biometrics fail?</Trans>}
                    answer={
                        <Trans>
                            Nothing dramatic: the PIN keypad is already on screen, so you simply type your PIN. Budgie turns the
                            device-passcode fallback off, and there is no attempt counter that locks you out of your own database.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I disable biometrics?</Trans>}
                    answer={
                        <Trans>
                            Yes — Settings → Security → App Lock, then the Face ID / Touch ID row inside the card. The PIN stays active.
                            Turning App Lock off switches biometrics off with it.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is Face ID safer than a PIN?</Trans>}
                    answer={
                        <Trans>
                            They&apos;re complementary. Biometrics are convenient and prevent shoulder-surfing; the PIN is the actual
                            encryption key. Both raise the bar.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
