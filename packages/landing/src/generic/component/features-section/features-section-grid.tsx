import { msg } from '@lingui/core/macro';
import { Banknote, BarChart3, Bitcoin, Calendar, Layers, Mic, Sparkles, Tag, Target, TrendingUp, Wallet, WifiOff } from 'lucide-react';
import Link from 'next/link';

import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { FeaturesSectionItem } from '../features-section-item/features-section-item';

import { FeaturesSectionGridMotion } from './features-section-grid-motion';

interface Props {
    readonly locale: string;
}

// eslint-disable-next-line max-lines-per-function -- 12-card grid component requires many lines
export const FeaturesSectionGrid = ({ locale }: Props) => {
    const i18n = getI18nInstance(locale);

    return (
        <FeaturesSectionGridMotion>
            <Link href={`/${locale}/features/spending-analytics`}>
                <FeaturesSectionItem
                    description={i18n._(
                        msg`See where every dollar goes. Drillable category and tag breakdowns find what's eating your budget.`
                    )}
                    icon={<BarChart3 className="size-5" />}
                    title={i18n._(msg`Spending Insights`)}
                />
            </Link>

            <Link href={`/${locale}/features/monobank-sync`}>
                <FeaturesSectionItem
                    description={i18n._(
                        msg`Direct Monobank API sync, plus PDF/Excel/CSV imports for any bank. No aggregator in the middle.`
                    )}
                    icon={<Banknote className="size-5" />}
                    title={i18n._(msg`Bank Sync`)}
                />
            </Link>

            <Link href={`/${locale}/features/ai-auto-categorization`}>
                <FeaturesSectionItem
                    description={i18n._(msg`A 1.7B-parameter LLM and 768-dim embedding model categorize every transaction on your phone.`)}
                    icon={<Sparkles className="size-5" />}
                    title={i18n._(msg`AI Auto-Categorize`)}
                />
            </Link>

            <Link href={`/${locale}/features/voice-transaction-entry`}>
                <FeaturesSectionItem
                    description={i18n._(
                        msg`Speak it. Budgie logs it. Whisper.rn transcribes on-device — your voice never streams to a server.`
                    )}
                    icon={<Mic className="size-5" />}
                    title={i18n._(msg`Voice Entry`)}
                />
            </Link>

            <Link href={`/${locale}/features/net-worth-tracker`}>
                <FeaturesSectionItem
                    description={i18n._(msg`Bank, cash, crypto, stocks, debt — one number on your home screen with daily FX conversion.`)}
                    icon={<TrendingUp className="size-5" />}
                    title={i18n._(msg`Net Worth`)}
                />
            </Link>

            <Link href={`/${locale}/features/crypto-investment-tracking`}>
                <FeaturesSectionItem
                    description={i18n._(msg`Track Bitcoin, Ethereum, stocks, and ETFs alongside cash accounts. Manual or CSV imports.`)}
                    icon={<Bitcoin className="size-5" />}
                    title={i18n._(msg`Crypto & Investments`)}
                />
            </Link>

            <Link href={`/${locale}/features/transaction-tags`}>
                <FeaturesSectionItem
                    description={i18n._(msg`Custom tags layered on top of categories. Drillable analytics and AI-suggested tags built in.`)}
                    icon={<Tag className="size-5" />}
                    title={i18n._(msg`Smart Tags`)}
                />
            </Link>

            <Link href={`/${locale}/features/multi-currency`}>
                <FeaturesSectionItem
                    description={i18n._(
                        msg`Track expenses in any currency with daily exchange rates baked in. Built for travelers and remote workers.`
                    )}
                    icon={<Layers className="size-5" />}
                    title={i18n._(msg`Multi-Currency`)}
                />
            </Link>

            <Link href={`/${locale}/features/account-management`}>
                <FeaturesSectionItem
                    description={i18n._(
                        msg`Checking, savings, credit cards, cash, and brokerage in one private app. No bank login required.`
                    )}
                    icon={<Wallet className="size-5" />}
                    title={i18n._(msg`All Accounts`)}
                />
            </Link>

            <Link href={`/${locale}/features/offline-first-expense-tracker`}>
                <FeaturesSectionItem
                    description={i18n._(msg`Every transaction lives on your device. No cloud account, no sign-up, fully offline-capable.`)}
                    icon={<WifiOff className="size-5" />}
                    title={i18n._(msg`Offline-First`)}
                />
            </Link>

            <Link href={`/${locale}/features/recurring-payments-calendar`}>
                <FeaturesSectionItem
                    description={i18n._(
                        msg`Auto-detected recurring payments laid out on a 60-day calendar so subscriptions stop surprising you.`
                    )}
                    icon={<Calendar className="size-5" />}
                    title={i18n._(msg`Recurring Bills`)}
                />
            </Link>

            <Link href={`/${locale}/features/debt-tracking`}>
                <FeaturesSectionItem
                    description={i18n._(msg`Track loan balances, watch the principal drop, and stay motivated with progress charts.`)}
                    icon={<Target className="size-5" />}
                    title={i18n._(msg`Debt Payoff`)}
                />
            </Link>
        </FeaturesSectionGridMotion>
    );
};
