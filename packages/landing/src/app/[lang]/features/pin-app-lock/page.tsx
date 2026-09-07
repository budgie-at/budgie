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

export default async function PinAppLockFeaturePage(props: PageLangParam) {
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
                heading={<Trans>PIN App Lock — Locks With the Encryption Key</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        A 4-digit PIN unlocks the app and unlocks the SQLCipher database. Without the PIN, the database file is unreadable —
                        even with full filesystem access.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Nothing opens before the PIN</Trans>}>
                    <Trans>
                        Three frames: the keypad the app opens on, the four digits that open the encrypted database, and the Settings group
                        where you switch the lock on.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>The app opens on the lock screen</Trans>}>
                    <Trans>
                        With App Lock on, every route in the app redirects to this keypad until the PIN checks out — on every cold launch,
                        and again the moment the app goes to the background. There is nothing behind it to read: no balances, no transaction
                        list, no skip.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie lock screen on launch, showing Enter your PIN above four empty dots and a number keypad`}
                    index={0}
                    locale={lang}
                    priority
                    scene="pin-app-lock-2"
                    slug="pin-app-lock"
                >
                    <FeatureStory.Callout x={0.72} y={0.409}>
                        <Trans>Four slots, nothing typed</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout x={0.8} y={0.566}>
                        <Trans>No skip, no PIN reset</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The four digits are the key</Trans>}>
                    <Trans>
                        The PIN is what SQLCipher opens the database with. Budgie keeps it in the device keychain, marked this-device-only,
                        and hands it to the database as the encryption key; changing the PIN re-encrypts the whole file under the new one.
                        The fourth digit submits on its own — a wrong PIN clears the dots and says so, and there is no reset that hands the
                        data back.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie lock screen with two of the four PIN dots filled in while the PIN is typed`}
                    index={1}
                    locale={lang}
                    scene="pin-app-lock-1"
                    slug="pin-app-lock"
                >
                    <FeatureStory.Callout x={0.72} y={0.409}>
                        <Trans>Two of four digits in</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout x={0.8} y={0.566}>
                        <Trans>The fourth digit submits</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>You switch it on in Settings</Trans>}>
                    <Trans>
                        App Lock sits in the Security group. Tap Enable, pick the four digits, and if your device has Face ID or Touch ID
                        enrolled Budgie offers to unlock with it — the keypad stays as the fallback. Screenshot Protection is its own switch
                        directly underneath.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen with the Security group showing the App Lock card and the Screenshot Protection switch turned on`}
                    index={2}
                    locale={lang}
                    scene="screenshot-protection-1"
                    slug="screenshot-protection"
                >
                    <FeatureStory.Callout y={0.42}>
                        <Trans>App Lock: PIN and Face ID</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.527}>
                        <Trans>Balances hidden from screenshots</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why most app locks are decoration</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most app locks are decoration — a screen you can bypass by reading the storage layer. Budgie&apos;s PIN is wired to
                        SQLCipher, so the same digits that pass the lock screen also derive the database encryption key.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        App goes to background → lock kicks in. A wrong PIN doesn&apos;t lock you out forever, but there is no reset that
                        hands the data back (your call: keep the PIN safe).
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>PIN derives the SQLCipher database encryption key — not just a screen guard</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>A 4-digit PIN, set from Settings → Security</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Re-locks the moment the app goes to background</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Optional Face ID or Touch ID unlock, with the PIN as fallback</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>No &ldquo;forgot PIN&rdquo; recovery — that&apos;s the privacy guarantee</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What if I forget my PIN?</Trans>}
                    answer={
                        <Trans>
                            The PIN is the encryption key — there&apos;s no recovery mechanism, by design. Keep your PIN somewhere safe (a
                            password manager works) or use the database backup feature to restore from a known-good state.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How quickly does the app re-lock?</Trans>}
                    answer={
                        <Trans>
                            The moment the app goes to the background. There is no grace period and no inactivity setting to get wrong — the
                            next time you come back, the keypad is there.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is biometric the same as PIN security?</Trans>}
                    answer={
                        <Trans>
                            Biometric unlock is the platform&apos;s Face ID / Touch ID check standing in for typing the PIN. The PIN itself
                            stays in the device keychain, marked this-device-only, and remains the database key — biometrics are a faster
                            path to the same lock, not a second one.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does the lock work if my phone is jailbroken?</Trans>}
                    answer={
                        <Trans>
                            SQLCipher with a strong PIN protects against filesystem-level access, but a jailbroken device with active
                            malware can capture the PIN at entry time. Don&apos;t unlock Budgie on a compromised device.
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
