import { msg, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { BlogSection } from '../../generic/component/blog-section/blog-section';
import { CapabilityBento } from '../../generic/component/capability-bento/capability-bento';
import { ComparisonSection } from '../../generic/component/comparison-section/comparison-section';
import { CtaSection } from '../../generic/component/cta-section/cta-section';
import { FaqSection } from '../../generic/component/faq-section/faq-section';
import { HeroSection } from '../../generic/component/hero-section/hero-section';
import { HomeTourSection } from '../../generic/component/home-tour-section/home-tour-section';
import { JsonLd } from '../../generic/component/json-ld/json-ld';
import { ProofBand } from '../../generic/component/proof-band/proof-band';
import { TestimonialsSection } from '../../generic/component/testimonials-section/testimonials-section';
import { TrustBanner } from '../../generic/component/trust-banner/trust-banner';
import { buildLandingJsonLd } from '../../generic/util/build-landing-json-ld.util';
import { getI18nInstance } from '../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../i18n/init-lingui';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: { absolute: i18n._(msg`Budgie - Privacy-First Expense Tracker`) }
    };
}

// eslint-disable-next-line max-lines-per-function -- Landing route composes every home section inline
export default async function LandingPage(props: PageLangParam) {
    const { lang } = await props.params;

    initLingui(lang);

    const i18n = getI18nInstance(lang);
    const softwareApplication = buildLandingJsonLd(i18n);

    return (
        <main className="flex-1">
            <JsonLd data={softwareApplication} />

            <HeroSection locale={lang} />
            <TrustBanner />

            <HomeTourSection locale={lang} />

            <CapabilityBento
                heading={<Trans>Everything the app does, on your device</Trans>}
                lede={<Trans>Accounts, budgets, analytics and bank imports, all running from the same local database.</Trans>}
            >
                <CapabilityBento.Anchor
                    alt={t(i18n)`Budgie settings screen showing the 100% offline and private card above app lock and screenshot protection`}
                    href={`/${lang}/features/offline-first-expense-tracker`}
                    locale={lang}
                    scene="offline-first-expense-tracker-2"
                    slug="offline-first-expense-tracker"
                    title={<Trans>Offline-first expense tracker</Trans>}
                >
                    <Trans>
                        No account, no cloud sync, no tracking. The database lives on your phone and the app never needs a connection to
                        open, search or calculate anything.
                    </Trans>
                </CapabilityBento.Anchor>

                <CapabilityBento.Cell
                    alt={t(i18n)`Budgie home screen with a total balance, savings accounts and money owed and lent`}
                    href={`/${lang}/features/net-worth-tracker`}
                    locale={lang}
                    scene="net-worth-tracker-2"
                    slug="net-worth-tracker"
                    title={<Trans>Net worth tracker for mobile</Trans>}
                >
                    <Trans>Cash, bank, savings, crypto and debt in one number, converted daily.</Trans>
                </CapabilityBento.Cell>

                <CapabilityBento.Cell
                    alt={t(i18n)`Budgie Monobank screen listing two cards and a car jar with their balances`}
                    href={`/${lang}/features/monobank-sync`}
                    locale={lang}
                    scene="monobank-sync-1"
                    slug="monobank-sync"
                    title={<Trans>Monobank sync with no aggregator</Trans>}
                >
                    <Trans>Your own token calls the bank API directly. No Plaid, no data broker.</Trans>
                </CapabilityBento.Cell>

                <CapabilityBento.Cell
                    alt={t(i18n)`Budgie budget details screen with a monthly budget bar and per-category limits`}
                    href={`/${lang}/features/budget-planning`}
                    locale={lang}
                    scene="budget-planning-2"
                    slug="budget-planning"
                    title={<Trans>Budget limits that match your payday</Trans>}
                >
                    <Trans>Set a monthly ceiling and per-category limits that reset when you get paid.</Trans>
                </CapabilityBento.Cell>

                <CapabilityBento.Cell
                    alt={t(i18n)`Budgie analytics screen breaking spending down by category with amounts and percentages`}
                    href={`/${lang}/features/spending-analytics`}
                    locale={lang}
                    scene="spending-analytics-1"
                    slug="spending-analytics"
                    title={<Trans>Spending analytics that actually help</Trans>}
                >
                    <Trans>Category and tag breakdowns for any period, each one drilling into its transactions.</Trans>
                </CapabilityBento.Cell>

                <CapabilityBento.Cell
                    alt={t(i18n)`Budgie recurring payments calendar showing upcoming subscriptions on a monthly grid`}
                    href={`/${lang}/features/recurring-payments-calendar`}
                    locale={lang}
                    scene="recurring-payments-calendar-1"
                    slug="recurring-payments-calendar"
                    title={<Trans>Recurring payments calendar</Trans>}
                >
                    <Trans>Detected subscriptions laid out by date, so renewals stop surprising you.</Trans>
                </CapabilityBento.Cell>

                <CapabilityBento.Band href={`/${lang}/features`} title={<Trans>All Budgie features</Trans>}>
                    <Trans>Voice entry, split transactions, tags, multi-currency, PDF and CSV imports and more.</Trans>
                </CapabilityBento.Band>
            </CapabilityBento>

            <ComparisonSection />

            <ProofBand locale={lang} />

            <TestimonialsSection />

            <FaqSection />
            <BlogSection locale={lang} />

            <CtaSection />
        </main>
    );
}
