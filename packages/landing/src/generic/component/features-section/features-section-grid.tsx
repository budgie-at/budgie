'use client';

import { useLingui } from '@lingui/react/macro';
import {
    Banknote,
    BarChart3,
    Bitcoin,
    CreditCard,
    Layers,
    PiggyBank,
    Shield,
    Tag,
    Target,
    TrendingUp,
    Wallet,
    WifiOff
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { FeaturesSectionItem } from '../features-section-item/features-section-item';
import { Motion } from '../motion/motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const viewportOnce = { once: true };

// eslint-disable-next-line max-lines-per-function -- Grid component requires many lines for 12 explicit feature card instances
export const FeaturesSectionGrid = () => {
    const { t } = useLingui();
    const { lang } = useParams<{ lang: string }>();

    return (
        <Motion
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            variants={containerVariants}
            viewport={viewportOnce}
            whileInView="show"
        >
            <Link href={`/${lang}/features/spending-analytics`}>
                <FeaturesSectionItem
                    description={t`See where every dollar goes. Our category breakdown shows you exactly what's eating your budget.`}
                    icon={<BarChart3 className="size-5" />}
                    title={t`Spending Insights`}
                />
            </Link>

            <Link href={`/${lang}/features/monobank-sync`}>
                <FeaturesSectionItem
                    description={t`Connect your bank accounts and import transactions automatically. No manual entry needed.`}
                    icon={<Banknote className="size-5" />}
                    title={t`Bank Sync`}
                />
            </Link>

            <Link href={`/${lang}/features/crypto-investment-tracking`}>
                <FeaturesSectionItem
                    description={t`Track Bitcoin, Ethereum, and all your crypto holdings alongside traditional accounts.`}
                    icon={<Bitcoin className="size-5" />}
                    title={t`Crypto Tracking`}
                />
            </Link>

            <Link href={`/${lang}/features/crypto-investment-tracking`}>
                <FeaturesSectionItem
                    description={t`Monitor stocks, ETFs, and investment accounts. See your complete net worth in one view.`}
                    icon={<TrendingUp className="size-5" />}
                    title={t`Investment Portfolio`}
                />
            </Link>

            <Link href={`/${lang}/features`}>
                <FeaturesSectionItem
                    description={t`Set spending goals and track debt payoff. Watch your progress and stay motivated.`}
                    icon={<Target className="size-5" />}
                    title={t`Goals & Budgets`}
                />
            </Link>

            <Link href={`/${lang}/features/transaction-tags`}>
                <FeaturesSectionItem
                    description={t`Create custom tags and categories. Organize transactions your way for deeper insights.`}
                    icon={<Tag className="size-5" />}
                    title={t`Custom Tags`}
                />
            </Link>

            <Link href={`/${lang}/features/multi-currency`}>
                <FeaturesSectionItem
                    description={t`Track expenses in any currency with real-time exchange rates. Perfect for travelers.`}
                    icon={<Layers className="size-5" />}
                    title={t`Multi-Currency`}
                />
            </Link>

            <Link href={`/${lang}/features/account-management`}>
                <FeaturesSectionItem
                    description={t`Track all your credit cards in one place. Never miss a payment or overspend again.`}
                    icon={<CreditCard className="size-5" />}
                    title={t`Credit Cards`}
                />
            </Link>

            <Link href={`/${lang}/features/offline-first-expense-tracker`}>
                <FeaturesSectionItem
                    description={t`Your data stays on your device. No cloud, no tracking, no data mining. Ever.`}
                    icon={<Shield className="size-5" />}
                    title={t`100% Private`}
                />
            </Link>

            <Link href={`/${lang}/features/offline-first-expense-tracker`}>
                <FeaturesSectionItem
                    description={t`Works without internet. Add expenses anywhere, sync when you're back online.`}
                    icon={<WifiOff className="size-5" />}
                    title={t`Offline-First`}
                />
            </Link>

            <Link href={`/${lang}/features/expense-tracking`}>
                <FeaturesSectionItem
                    description={t`Track cash spending easily. Perfect for markets, tips, and small purchases.`}
                    icon={<PiggyBank className="size-5" />}
                    title={t`Cash Tracking`}
                />
            </Link>

            <Link href={`/${lang}/features/account-management`}>
                <FeaturesSectionItem
                    description={t`Link multiple savings accounts. Watch your emergency fund and goals grow.`}
                    icon={<Wallet className="size-5" />}
                    title={t`Savings Accounts`}
                />
            </Link>
        </Motion>
    );
};
