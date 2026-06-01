/* eslint-disable max-lines -- File owns a single feature registry that must stay together */
import { msg } from '@lingui/core/macro';

import { FeatureCategoryEnum } from './feature-category.enum';
import { FeatureTierEnum } from './feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings */
export const FEATURE_REGISTRY: readonly FeatureRegistryEntryInterface[] = [
    {
        slug: 'offline-first-expense-tracker',
        tier: FeatureTierEnum.HERO,
        title: msg`Offline-First Expense Tracker`,
        tagline: msg`Every transaction lives on your device. No cloud account, no sign-up.`,
        metaTitle: msg`Offline-First Expense Tracker — Budgie`,
        metaDescription: msg`Budgie is a 100% offline-first expense tracker. Your financial data never leaves your phone — encrypted SQLite, no cloud servers, no account required to start.`,
        primaryKeyword: 'offline expense tracker app',
        seoKeywords: [
            'offline expense tracker',
            'offline budget app',
            'private finance app',
            'no account budget app',
            'local-first expense tracker'
        ],
        relatedFeatureSlugs: ['monobank-sync', 'ai-auto-categorization', 'pin-app-lock', 'database-backup', 'biometric-authentication'],
        relatedArticleSlugs: ['offline-first-privacy-financial-app', 'budgie-offline-financial-data', 'mint-shutdown-private-alternative'],
        publishedAt: '2025-12-01',
        updatedAt: '2026-05-03',
        ogTags: ['offline-first', 'privacy', 'expense tracker']
    },
    {
        slug: 'monobank-sync',
        tier: FeatureTierEnum.HERO,
        title: msg`Monobank Expense Tracker — Direct API Sync, No Plaid`,
        tagline: msg`Direct API. No aggregator. Full transaction history to your device.`,
        metaTitle: msg`Monobank Auto-Sync — Budgie`,
        metaDescription: msg`Connect your Monobank account with a personal API token. Full transaction history, FX rates, and counter-IBANs sync straight to your device — no Plaid.`,
        primaryKeyword: 'monobank expense tracker',
        seoKeywords: ['monobank sync', 'monobank api', 'monobank expense tracker', 'monobank transaction import', 'monobank budget app'],
        relatedFeatureSlugs: [
            'offline-first-expense-tracker',
            'bank-resync-window',
            'csv-import',
            'erste-bank-pdf-import',
            'privatbank-import'
        ],
        relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'budgie-offline-financial-data', 'offline-first-bank-data-safety'],
        publishedAt: '2025-12-25',
        updatedAt: '2026-05-07',
        ogTags: ['monobank', 'bank sync', 'privacy']
    },
    {
        slug: 'ai-auto-categorization',
        tier: FeatureTierEnum.HERO,
        title: msg`On-Device AI Auto-Categorization`,
        tagline: msg`Two on-device models — Qwen3 1.7B for chat and a 768-dim embedding model — power category, tag, and merchant suggestions privately.`,
        metaTitle: msg`On-Device AI Auto-Categorization — Budgie`,
        metaDescription: msg`Budgie runs Qwen3 1.7B + a 768-dim embedding model on your phone. Two-stage categorization with corrections feeding the embedding index.`,
        primaryKeyword: 'AI expense categorization',
        seoKeywords: [
            'AI expense categorization',
            'on-device AI budget app',
            'private AI finance',
            'local LLM expense tracker',
            'machine learning expense categorization'
        ],
        relatedFeatureSlugs: [
            'offline-first-expense-tracker',
            'voice-transaction-entry',
            'mcc-auto-category',
            'custom-categories',
            'uncategorized-transactions',
            'recurring-payments-calendar'
        ],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app', 'on-device-ai-budget-app-explainer'],
        publishedAt: '2026-02-06',
        updatedAt: '2026-05-07',
        ogTags: ['ai', 'on-device', 'privacy']
    },
    {
        slug: 'ai-transaction-suggestions',
        tier: FeatureTierEnum.CORE,
        title: msg`Smart Transaction Suggestions — Tap and Done`,
        tagline: msg`Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags, comment, amount, account, all pre-filled.`,
        metaTitle: msg`Smart Expense Suggestions for Mobile — Budgie`,
        metaDescription: msg`Budgie suggests category, tags, and amount from your own SQL patterns and 768-dim embeddings. Faster manual entry than any AI cloud assistant.`,
        primaryKeyword: 'smart expense suggestions',
        seoKeywords: [
            'smart expense suggestions',
            'auto-fill expense form',
            'transaction prediction app',
            'on-device expense suggestions',
            'AI form pre-fill budget app'
        ],
        relatedFeatureSlugs: [
            'ai-auto-categorization',
            'recurring-payments-calendar',
            'expense-tracking',
            'ai-tag-suggestions',
            'transaction-tags'
        ],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['ai', 'suggestions', 'expense-tracking']
    },
    {
        slug: 'ai-tag-suggestions',
        tier: FeatureTierEnum.POWER,
        title: msg`Automatic Tag Suggestions — Tap, Don't Type`,
        tagline: msg`After picking a category, the on-device LLM proposes up to three tags as tappable pills. Embedding-first fallback when the LLM is busy.`,
        metaTitle: msg`Automatic Expense Tags — On-Device — Budgie`,
        metaDescription: msg`Budgie's local LLM suggests up to three tags per transaction so heavy taggers stop typing. Embedding fallback keeps it instant offline.`,
        primaryKeyword: 'automatic expense tags',
        seoKeywords: [
            'automatic expense tags',
            'AI tag suggestions',
            'on-device tag prediction',
            'expense tag autocomplete',
            'LLM transaction tags'
        ],
        relatedFeatureSlugs: ['transaction-tags', 'tag-analytics', 'ai-auto-categorization', 'ai-transaction-suggestions', 'primary-tag'],
        relatedArticleSlugs: ['budgie-offline-financial-data'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['ai', 'tags', 'suggestions']
    },
    {
        slug: 'voice-transaction-entry',
        tier: FeatureTierEnum.HERO,
        title: msg`Voice Transaction Entry`,
        tagline: msg`Speak it. Budgie logs it. whisper.rn (whisper.cpp backend) transcribes on-device — audio never leaves your phone.`,
        metaTitle: msg`Voice-to-Expense, On-Device — Budgie`,
        metaDescription: msg`Say "twelve dollars coffee this morning" and Budgie logs it. whisper.rn (whisper.cpp backend) and the on-device LLM both run locally — no audio ever streams to a server.`,
        primaryKeyword: 'voice expense tracker',
        seoKeywords: [
            'voice expense tracker',
            'voice budget app',
            'speech-to-text expenses',
            'voice transaction logging',
            'on-device whisper'
        ],
        relatedFeatureSlugs: ['ai-auto-categorization', 'expense-tracking', 'ai-merchant-translation'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        publishedAt: '2026-01-22',
        updatedAt: '2026-05-07',
        ogTags: ['voice', 'on-device', 'ai']
    },
    {
        slug: 'net-worth-tracker',
        tier: FeatureTierEnum.HERO,
        title: msg`Net Worth Tracker for Mobile`,
        tagline: msg`Bank, cash, crypto, stocks, debt — one number on your home screen.`,
        metaTitle: msg`Net Worth Tracker for Mobile — Budgie`,
        metaDescription: msg`Roll up every bank account, cash wallet, crypto holding, stock position, and liability into a single net-worth number. Multi-currency conversion baked in.`,
        primaryKeyword: 'net worth tracker app',
        seoKeywords: [
            'net worth tracker app',
            'net worth dashboard',
            'multi-account net worth',
            'crypto net worth tracker',
            'mobile net worth app'
        ],
        relatedFeatureSlugs: ['account-management', 'multi-currency', 'debt-tracking', 'crypto-investment-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2026-01-03',
        updatedAt: '2026-05-03',
        ogTags: ['net worth', 'multi-currency', 'dashboard']
    },
    {
        slug: 'expense-tracking',
        tier: FeatureTierEnum.CORE,
        title: msg`Expense Tracking, Reimagined`,
        tagline: msg`Two taps from open to saved — a bottom-sheet quick-entry form designed for one-handed use.`,
        metaTitle: msg`Expense Tracking, Reimagined — Budgie`,
        metaDescription: msg`Log expenses, income, and transfers in seconds. Budgie tracks every transaction on-device with smart suggestions and zero cloud accounts.`,
        primaryKeyword: 'personal expense tracker',
        seoKeywords: [
            'personal expense tracker',
            'expense tracking app',
            'log expenses fast',
            'mobile expense logger',
            'expense tracker bottom sheet'
        ],
        relatedFeatureSlugs: [
            'voice-transaction-entry',
            'custom-categories',
            'transaction-tags',
            'split-transactions',
            'recurring-payments-calendar'
        ],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-12-14',
        updatedAt: '2026-05-03',
        ogTags: ['expense tracking', 'transactions', 'mobile']
    },
    {
        slug: 'transaction-long-press-menu',
        tier: FeatureTierEnum.CORE,
        title: msg`Long-Press Quick Actions on Every Transaction`,
        tagline: msg`Long-press any transaction card to edit, delete, split, convert to transfer, or convert income to a refund — no full edit form required.`,
        metaTitle: msg`Quick Edit Transaction App — Long-Press Menu — Budgie`,
        metaDescription: msg`Long-press any transaction in Budgie for a native context menu: edit, delete, split, convert to transfer, or convert income to refund. Two taps where the rest of the market needs five.`,
        primaryKeyword: 'quick edit transaction app',
        seoKeywords: [
            'quick edit transaction app',
            'long-press transaction menu',
            'context menu expense tracker',
            'transaction quick actions',
            'gesture-driven budget app'
        ],
        relatedFeatureSlugs: [
            'expense-tracking',
            'convert-to-transfer',
            'convert-to-refund',
            'split-transactions',
            'transaction-tags',
            'ai-transaction-suggestions'
        ],
        relatedArticleSlugs: ['budgie-offline-financial-data'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['ux', 'gestures', 'productivity']
    },
    {
        slug: 'account-management',
        tier: FeatureTierEnum.CORE,
        title: msg`Multi-Account Money Management`,
        tagline: msg`Bank, cash, savings, crypto, stocks, debt — all on one home screen.`,
        metaTitle: msg`Multi-Account Money Management — Budgie`,
        metaDescription: msg`Track checking, savings, credit cards, cash, and brokerage accounts in one private app. Multi-currency, offline-first, no bank login required.`,
        primaryKeyword: 'money management app',
        seoKeywords: [
            'money management app',
            'multi-account budget app',
            'unlimited accounts tracker',
            'crypto and bank tracker',
            'mobile money manager'
        ],
        relatedFeatureSlugs: ['net-worth-tracker', 'multi-currency', 'debt-tracking', 'crypto-investment-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
        publishedAt: '2025-11-17',
        updatedAt: '2026-05-03',
        ogTags: ['accounts', 'management', 'multi-account']
    },
    {
        slug: 'spending-analytics',
        tier: FeatureTierEnum.CORE,
        title: msg`Spending Analytics That Actually Help`,
        tagline: msg`Category breakdown, tag breakdown, monthly trends — drill into any chart slice.`,
        metaTitle: msg`Spending Analytics & Charts — Budgie`,
        metaDescription: msg`Category and tag breakdown charts, monthly trends, and balance timelines — with drill-down from any chart slice to the underlying transactions. Analytics that find your gaps.`,
        primaryKeyword: 'spending tracker with charts',
        seoKeywords: [
            'spending tracker with charts',
            'expense analytics app',
            'category breakdown chart',
            'tag analytics',
            'mobile finance dashboard'
        ],
        relatedFeatureSlugs: [
            'tag-analytics',
            'custom-categories',
            'uncategorized-transactions',
            'date-filter-presets',
            'recurring-payments-calendar',
            'ai-merchant-translation'
        ],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-12-19',
        updatedAt: '2026-05-03',
        ogTags: ['analytics', 'charts', 'drill-down']
    },
    {
        slug: 'uncategorized-transactions',
        tier: FeatureTierEnum.CORE,
        title: msg`Uncategorized Transaction Finder`,
        tagline: msg`A filter-aware missing-category pill surfaces uncategorized transactions before they distort your budget analytics.`,
        metaTitle: msg`Uncategorized Transactions Finder`,
        metaDescription: msg`Budgie finds uncategorized transactions under your active filters. Tap the missing-category pill to clean category gaps fast, offline, and on-device.`,
        primaryKeyword: 'uncategorized transactions',
        seoKeywords: [
            'uncategorized transactions',
            'missing category transactions',
            'categorize expenses app',
            'expense category cleanup',
            'budget analytics cleanup'
        ],
        relatedFeatureSlugs: [
            'custom-categories',
            'spending-analytics',
            'ai-auto-categorization',
            'date-filter-presets',
            'mcc-auto-category'
        ],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
        publishedAt: '2026-05-18',
        updatedAt: '2026-05-18',
        ogTags: ['uncategorized', 'categories', 'analytics']
    },
    {
        slug: 'custom-categories',
        tier: FeatureTierEnum.CORE,
        title: msg`Custom Spending Categories That Bend To You`,
        tagline: msg`Create, merge, reassign, and reorder until the tree matches how you actually think about money.`,
        metaTitle: msg`Custom Spending Categories — Budgie`,
        metaDescription: msg`Build, merge, and reassign your own spending categories with mass-migration. Popularity-sorted selectors and MCC pre-fill keep the right category one tap away.`,
        primaryKeyword: 'custom budget categories',
        seoKeywords: [
            'custom budget categories',
            'custom expense categories',
            'merge categories app',
            'reassign transactions categories',
            'budget category tree'
        ],
        relatedFeatureSlugs: [
            'ai-auto-categorization',
            'expense-tracking',
            'uncategorized-transactions',
            'transaction-tags',
            'spending-analytics',
            'split-transactions'
        ],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-11-19',
        updatedAt: '2026-05-03',
        ogTags: ['categories', 'custom', 'organization']
    },
    {
        slug: 'transaction-tags',
        tier: FeatureTierEnum.CORE,
        title: msg`Transaction Tags for Multi-Dimensional Tracking`,
        tagline: msg`Layer tags on top of categories — one transaction can be Groceries (category) and #vacation, #shared, #reimbursable (tags).`,
        metaTitle: msg`Custom Transaction Tags for Expense Tracking — Budgie`,
        metaDescription: msg`Tags answer "for which project, person, or purpose" — separate from categories. Multi-select fast, promote a primary tag for at-a-glance scanning, and slice analytics per tag.`,
        primaryKeyword: 'transaction labels app',
        seoKeywords: [
            'transaction labels app',
            'expense tagging app',
            'tag transactions',
            'project expense tags',
            'shared expense tracker'
        ],
        relatedFeatureSlugs: ['tag-analytics', 'primary-tag', 'custom-categories', 'expense-tracking', 'split-transactions'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-11-19',
        updatedAt: '2026-05-03',
        ogTags: ['tags', 'organization', 'analytics']
    },
    {
        slug: 'account-transfers',
        tier: FeatureTierEnum.CORE,
        title: msg`Account Transfers — Done Right`,
        tagline: msg`Cross-currency, dual-amount, exact — money between your own accounts is never an expense.`,
        metaTitle: msg`Account Transfers — Budgie`,
        metaDescription: msg`Transfer between your own accounts as a first-class transaction type with automatic FX conversion and dual-amount display. Spending stats stay clean; balance reconciliation stays exact.`,
        primaryKeyword: 'transfer between accounts app',
        seoKeywords: [
            'transfer between accounts app',
            'cross-currency transfer tracker',
            'first-class transfers app',
            'dual-amount transfer',
            'FX transfer tracking'
        ],
        relatedFeatureSlugs: ['transfer-pair-detection', 'convert-to-transfer', 'multi-currency', 'bank-resync-window'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
        publishedAt: '2025-12-19',
        updatedAt: '2026-05-03',
        ogTags: ['transfers', 'multi-currency', 'accounts']
    },
    {
        slug: 'csv-import',
        tier: FeatureTierEnum.CORE,
        title: msg`CSV Bank Statement Import`,
        tagline: msg`Any bank, any column order — set it up once per source, then it's two taps from there.`,
        metaTitle: msg`CSV Import for Bank Statements & Transactions — Budgie`,
        metaDescription: msg`Import any bank's CSV with flexible column mapping, save the mapping as a preset, and re-import safely with deduplication. Universal escape hatch for banks without an API.`,
        primaryKeyword: 'import bank statement CSV',
        seoKeywords: [
            'import bank statement CSV',
            'CSV bank import app',
            'flexible CSV column mapping',
            'CSV import preset',
            'bank statement importer'
        ],
        relatedFeatureSlugs: ['erste-bank-pdf-import', 'privatbank-import', 'monobank-sync', 'data-export', 'bank-resync-window'],
        relatedArticleSlugs: [
            'mint-alternatives-developers',
            'budgie-offline-financial-data',
            'historical-exchange-rates-budget-analytics'
        ],
        publishedAt: '2025-12-21',
        updatedAt: '2026-05-03',
        ogTags: ['csv', 'import', 'bank statement']
    },
    {
        slug: 'erste-bank-pdf-import',
        tier: FeatureTierEnum.CORE,
        title: msg`Erste Bank PDF Import`,
        tagline: msg`Classic and modern PDF formats — full statement import in seconds.`,
        metaTitle: msg`Erste Bank PDF Import — Budgie`,
        metaDescription: msg`Import your full Erste Bank statement straight from PDF — both classic and the new 2026 modern format. Account holder, IBAN, balances, and every transaction line parsed.`,
        primaryKeyword: 'Erste Bank statement import',
        seoKeywords: [
            'Erste Bank statement import',
            'Erste PDF import',
            'Erste Bank transaction parser',
            'Austrian bank statement import',
            'Erste statement to budget app'
        ],
        relatedFeatureSlugs: ['csv-import', 'privatbank-import', 'monobank-sync', 'mcc-auto-category'],
        relatedArticleSlugs: ['mint-alternatives-developers', 'budgie-offline-financial-data'],
        publishedAt: '2026-02-04',
        updatedAt: '2026-05-03',
        ogTags: ['erste', 'pdf', 'import']
    },
    {
        slug: 'privatbank-import',
        tier: FeatureTierEnum.CORE,
        title: msg`PrivatBank XLSX Import`,
        tagline: msg`XLSX, MCC-mapped, two taps — long-press an account card to re-import.`,
        metaTitle: msg`PrivatBank XLSX Import — Budgie`,
        metaDescription: msg`Import accounts and transactions from a PrivatBank24 XLSX export. PrivatBank's MCC categories map to ISO codes automatically so AI categorization downstream still works.`,
        primaryKeyword: 'PrivatBank transaction import',
        seoKeywords: [
            'PrivatBank transaction import',
            'PrivatBank24 XLSX import',
            'PrivatBank to budget app',
            'Ukrainian bank import',
            'PrivatBank statement parser'
        ],
        relatedFeatureSlugs: ['csv-import', 'erste-bank-pdf-import', 'monobank-sync', 'mcc-auto-category'],
        relatedArticleSlugs: ['mint-alternatives-developers', 'budgie-offline-financial-data'],
        publishedAt: '2026-02-02',
        updatedAt: '2026-05-03',
        ogTags: ['privatbank', 'xlsx', 'import']
    },
    {
        slug: 'pin-app-lock',
        tier: FeatureTierEnum.CORE,
        title: msg`PIN App Lock — Locks With the Encryption Key`,
        tagline: msg`The PIN unlocks the app and unlocks SQLCipher — no PIN, no readable database.`,
        metaTitle: msg`PIN Lock Finance App — Private Expense Tracker — Budgie`,
        metaDescription: msg`Budgie's PIN doesn't just gate the screen — it derives the SQLCipher encryption key. Without the PIN, the database file is unreadable, even with full filesystem access.`,
        primaryKeyword: 'PIN lock finance app',
        seoKeywords: [
            'PIN lock finance app',
            'encrypted finance app',
            'SQLCipher mobile',
            'PIN-protected expense tracker',
            'finance app screen lock'
        ],
        relatedFeatureSlugs: ['biometric-authentication', 'screenshot-protection', 'offline-first-expense-tracker', 'database-backup'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        publishedAt: '2025-12-18',
        updatedAt: '2026-05-03',
        ogTags: ['security', 'pin', 'encryption']
    },
    {
        slug: 'biometric-authentication',
        tier: FeatureTierEnum.CORE,
        title: msg`Face ID / Touch ID Authentication`,
        tagline: msg`Bank-grade biometric unlock — same Secure Enclave, same encryption key.`,
        metaTitle: msg`Biometric Authentication — Budgie`,
        metaDescription: msg`Face ID / Touch ID unlock that drives the same SQLCipher encryption key as your PIN. Frictionless, falls back to PIN when needed, respects platform lockout policy.`,
        primaryKeyword: 'Face ID expense app',
        seoKeywords: [
            'Face ID expense app',
            'Touch ID budget app',
            'biometric finance app',
            'Secure Enclave expense tracker',
            'biometric unlock finance'
        ],
        relatedFeatureSlugs: ['pin-app-lock', 'screenshot-protection', 'offline-first-expense-tracker'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        publishedAt: '2025-12-18',
        updatedAt: '2026-05-03',
        ogTags: ['biometric', 'face id', 'security']
    },
    {
        slug: 'data-export',
        tier: FeatureTierEnum.CORE,
        title: msg`Export Every Transaction You've Logged`,
        tagline: msg`CSV for spreadsheets. Encrypted database backup for restore. Both yours, never ours.`,
        metaTitle: msg`Data Export — Own Your Expense History — Budgie`,
        metaDescription: msg`One-tap CSV export of all transactions, plus a full encrypted database backup file you can save to iCloud, Drive, or anywhere. Your data, your call.`,
        primaryKeyword: 'export transactions CSV',
        seoKeywords: [
            'export transactions CSV',
            'export expense data',
            'CSV expense export app',
            'database backup expense tracker',
            'budget app data export'
        ],
        relatedFeatureSlugs: ['database-backup', 'csv-import'],
        relatedArticleSlugs: ['open-source-budgeting-transparency', 'local-first-movement-developers'],
        publishedAt: '2025-12-21',
        updatedAt: '2026-05-03',
        ogTags: ['export', 'csv', 'backup']
    },
    {
        slug: 'database-backup',
        tier: FeatureTierEnum.CORE,
        title: msg`Database Backup & Restore`,
        tagline: msg`One encrypted file. No account. Restore on any device in seconds.`,
        metaTitle: msg`Encrypted Database Backup to Your Cloud — Budgie`,
        metaDescription: msg`Capture your entire Budgie database in one encrypted file. Save to iCloud or Drive on your terms; restore on a new device with one tap and your PIN.`,
        primaryKeyword: 'expense tracker backup restore',
        seoKeywords: [
            'expense tracker backup restore',
            'finance app backup file',
            'mobile budget backup',
            'restore expense data',
            'no-account backup app'
        ],
        relatedFeatureSlugs: ['data-export', 'pin-app-lock', 'offline-first-expense-tracker'],
        relatedArticleSlugs: ['open-source-budgeting-transparency', 'local-first-movement-developers'],
        publishedAt: '2025-12-21',
        updatedAt: '2026-05-03',
        ogTags: ['backup', 'restore', 'encryption']
    },
    {
        slug: 'date-filter-presets',
        tier: FeatureTierEnum.CORE,
        title: msg`Date Filter Presets — Past Periods, One Tap`,
        tagline: msg`Eight presets, locale-aware week start, custom range fallback.`,
        metaTitle: msg`Date Filter Presets — Budgie`,
        metaDescription: msg`Today, Yesterday, This Week, Last Week, This Month, Last Month, This Year, All Time — every screen with a list, two taps to the right window. Locale-aware.`,
        primaryKeyword: 'filter transactions by date',
        seoKeywords: [
            'filter transactions by date',
            'date range expense tracker',
            'budget app date filter',
            'monthly view expense app',
            'date preset filter'
        ],
        relatedFeatureSlugs: [
            'spending-analytics',
            'uncategorized-transactions',
            'recurring-payments-calendar',
            'tag-analytics',
            'mcc-auto-category'
        ],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2026-05-02',
        updatedAt: '2026-05-03',
        ogTags: ['filters', 'dates', 'presets']
    },
    {
        slug: 'recurring-payments-calendar',
        tier: FeatureTierEnum.POWER,
        title: msg`Recurring Payments Calendar`,
        tagline: msg`Spot the slow leak before it bills — subscription patterns plotted on a month calendar with forecasted upcoming.`,
        metaTitle: msg`Recurring Payments Calendar — Budgie`,
        metaDescription: msg`Budgie auto-detects subscription and recurring-payment patterns from your history and plots them on a monthly calendar so you can see upcoming bills within the current month.`,
        primaryKeyword: 'recurring payment tracker',
        seoKeywords: [
            'recurring payment tracker',
            'subscription tracker app',
            'monthly bill calendar',
            'forecast bills budget app',
            'recurring expense detector'
        ],
        relatedFeatureSlugs: ['spending-analytics', 'ai-auto-categorization', 'date-filter-presets', 'expense-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2026-02-22',
        updatedAt: '2026-05-07',
        ogTags: ['recurring', 'subscriptions', 'calendar']
    },
    {
        slug: 'transfer-pair-detection',
        tier: FeatureTierEnum.POWER,
        title: msg`Smart Transfer and Refund Consolidation`,
        tagline: msg`Budgie consolidates obvious transfers and merchant refunds automatically, then leaves ambiguous matches for review.`,
        metaTitle: msg`Smart Transfer and Refund Consolidation — Budgie`,
        metaDescription: msg`Budgie merges obvious transfer pairs and merchant refunds so bank imports do not inflate spending or income. Counter-IBAN, amount, date, and title matching run on-device.`,
        primaryKeyword: 'duplicate transaction merger',
        seoKeywords: [
            'duplicate transaction merger',
            'transfer pair detection',
            'auto-merge transfers',
            'automatic refund matching',
            'IBAN match transfer',
            'cross-currency transfer detection'
        ],
        relatedFeatureSlugs: ['account-transfers', 'convert-to-refund', 'bank-resync-window', 'convert-to-transfer'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'mint-alternatives-developers'],
        publishedAt: '2026-05-01',
        updatedAt: '2026-05-07',
        ogTags: ['transfers', 'deduplication', 'smart']
    },
    {
        slug: 'split-transactions',
        tier: FeatureTierEnum.POWER,
        title: msg`Split a Transaction Across Categories`,
        tagline: msg`That €87 supermarket bill was groceries and a phone charger — split it.`,
        metaTitle: msg`Split Transactions — Budgie`,
        metaDescription: msg`Divide a single transaction across multiple categories with a remaining-budget indicator. Each split keeps its own tags and comment.`,
        primaryKeyword: 'split transaction by category',
        seoKeywords: [
            'split transaction by category',
            'split expense app',
            'multi-category transaction',
            'receipt split tracker',
            'split bill app'
        ],
        relatedFeatureSlugs: ['expense-tracking', 'custom-categories', 'transaction-tags'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2026-02-01',
        updatedAt: '2026-05-03',
        ogTags: ['split', 'categories', 'transactions']
    },
    {
        slug: 'ai-merchant-translation',
        tier: FeatureTierEnum.POWER,
        title: msg`AI Merchant Name Translation`,
        tagline: msg`Cyrillic, Greek, Arabic merchant strings — the on-device LLM transliterates and adds search keywords.`,
        metaTitle: msg`Foreign Merchant Name Normalizer — Budgie`,
        metaDescription: msg`Cyrillic, Greek, or Cyrillic-script merchant names get normalized to Latin so your transaction list reads cleanly. Runs on-device.`,
        primaryKeyword: 'foreign merchant name normalizer',
        seoKeywords: [
            'foreign merchant name normalizer',
            'bank statement translation app',
            'merchant name cleanup',
            'transliterate cyrillic merchants',
            'transaction description translator'
        ],
        relatedFeatureSlugs: ['spending-analytics', 'voice-transaction-entry', 'multi-language-app'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        publishedAt: '2026-02-07',
        updatedAt: '2026-05-03',
        ogTags: ['translation', 'ai', 'multilingual']
    },
    {
        slug: 'multi-currency',
        tier: FeatureTierEnum.POWER,
        title: msg`Multi-Currency Accounts With Live Rates`,
        tagline: msg`Track in any currency. Sum in yours. Daily FX-rate refresh keeps the math fair.`,
        metaTitle: msg`Multi-Currency Accounts — Budgie`,
        metaDescription: msg`Hold accounts in any currency. A nightly background task fetches fresh FX rates so dashboards always show in your home currency. Cross-currency transfers preserve both legs.`,
        primaryKeyword: 'multi currency expense tracker',
        seoKeywords: [
            'multi currency expense tracker',
            'multi-currency budget app',
            'FX-aware expense tracker',
            'mobile currency conversion app',
            'foreign currency tracker'
        ],
        relatedFeatureSlugs: ['account-management', 'net-worth-tracker', 'account-transfers', 'crypto-investment-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers', 'historical-exchange-rates-budget-analytics'],
        publishedAt: '2025-12-19',
        updatedAt: '2026-05-03',
        ogTags: ['multi-currency', 'fx', 'accounts']
    },
    {
        slug: 'debt-tracking',
        tier: FeatureTierEnum.POWER,
        title: msg`Debt & Loan Tracking`,
        tagline: msg`Money out, money in — first-class accounts with target balances, return dates, and contact assignment.`,
        metaTitle: msg`Debt & Loan Tracking — Budgie`,
        metaDescription: msg`Track money lent to friends or borrowed from others as first-class debt accounts with explicit direction, target balances, return dates, and contact links.`,
        primaryKeyword: 'personal debt tracker app',
        seoKeywords: ['personal debt tracker app', 'loan tracker app', 'IOU tracker', 'debt direction tracker', 'lent and borrowed app'],
        relatedFeatureSlugs: ['account-management', 'net-worth-tracker'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-12-29',
        updatedAt: '2026-05-03',
        ogTags: ['debt', 'loans', 'contacts']
    },
    {
        slug: 'bank-resync-window',
        tier: FeatureTierEnum.POWER,
        title: msg`Windowed Bank Re-sync`,
        tagline: msg`Re-pull a slice. Keep your edits. No nuke-from-orbit.`,
        metaTitle: msg`Bank Re-Sync Window — Backfill Missing Transactions — Budgie`,
        metaDescription: msg`Re-pull just the last N days of bank history without nuking your manual edits or category overrides. Conflict picker for edited rows.`,
        primaryKeyword: 'bank sync history reset',
        seoKeywords: [
            'bank sync history reset',
            're-sync window app',
            'partial bank re-import',
            'edited transaction conflict',
            'bank statement diff'
        ],
        relatedFeatureSlugs: ['monobank-sync', 'csv-import', 'account-transfers', 'transfer-pair-detection'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'mint-alternatives-developers'],
        publishedAt: '2026-05-02',
        updatedAt: '2026-05-03',
        ogTags: ['bank sync', 're-sync', 'edits']
    },
    {
        slug: 'mcc-auto-category',
        tier: FeatureTierEnum.POWER,
        title: msg`MCC Auto-Categorization`,
        tagline: msg`Bank-issued codes do the work — coffee shops land in Food & Drink, gas stations in Transport.`,
        metaTitle: msg`MCC Auto-Categorization for Bank Transactions — Budgie`,
        metaDescription: msg`Bank-synced transactions carry Merchant Category Codes; Budgie maps them to your category tree automatically. Per-MCC overrides for personal preferences.`,
        primaryKeyword: 'automatic transaction categories',
        seoKeywords: [
            'automatic transaction categories',
            'MCC auto category',
            'merchant category code app',
            'MCC mapping budget app',
            'bank-issued category codes'
        ],
        relatedFeatureSlugs: [
            'ai-auto-categorization',
            'uncategorized-transactions',
            'privatbank-import',
            'erste-bank-pdf-import',
            'date-filter-presets'
        ],
        relatedArticleSlugs: ['mint-alternatives-developers', 'ynab-alternatives-privacy'],
        publishedAt: '2026-01-02',
        updatedAt: '2026-05-03',
        ogTags: ['mcc', 'categorization', 'bank sync']
    },
    {
        slug: 'tag-analytics',
        tier: FeatureTierEnum.POWER,
        title: msg`Tag-Based Spending Analytics`,
        tagline: msg`A dedicated Tags tab in analytics with per-tag totals and a drillable Untagged bucket that surfaces every gap in your labeling.`,
        metaTitle: msg`Spending Analytics by Tag — Drillable Reports — Budgie`,
        metaDescription: msg`See income, expense, and net per tag in a dedicated analytics tab. The Untagged bucket finds every transaction missing a label so nothing falls through.`,
        primaryKeyword: 'spending by tag analytics',
        seoKeywords: [
            'spending by tag analytics',
            'tag-based budget app',
            'project expense analytics',
            'shared expense analytics',
            'reimbursable expense tracker'
        ],
        relatedFeatureSlugs: ['transaction-tags', 'primary-tag', 'spending-analytics', 'date-filter-presets'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2026-01-04',
        updatedAt: '2026-05-07',
        ogTags: ['tags', 'analytics', 'drill-down']
    },
    {
        slug: 'statistics-tags-tab',
        tier: FeatureTierEnum.POWER,
        title: msg`Tags Tab in Statistics — Per-Tag Income, Expense, and Net`,
        tagline: msg`A dedicated Tags tab in Statistics with sortable per-tag totals and a drillable Untagged bucket that surfaces every transaction missing a label.`,
        metaTitle: msg`Analytics by Tag — Per-Tag Spending Tab — Budgie`,
        metaDescription: msg`Budgie's Statistics screen has a dedicated Tags tab with income, expense, and net per tag plus a drillable Untagged bucket for finding labeling gaps.`,
        primaryKeyword: 'analytics by tag mobile',
        seoKeywords: [
            'analytics by tag mobile',
            'tag analytics expense tracker',
            'per-tag spending report',
            'untagged transactions report',
            'tag-based budgeting analytics'
        ],
        relatedFeatureSlugs: ['tag-analytics', 'spending-analytics', 'transaction-tags', 'ai-tag-suggestions', 'primary-tag'],
        relatedArticleSlugs: ['budgie-offline-financial-data'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['analytics', 'tags', 'statistics']
    },
    {
        slug: 'convert-to-transfer',
        tier: FeatureTierEnum.POWER,
        title: msg`Convert a Transaction to a Transfer`,
        tagline: msg`Reclassify, don't re-enter — turn an expense into a transfer in one tap.`,
        metaTitle: msg`Convert Expense to Transfer Between Accounts — Budgie`,
        metaDescription: msg`Logged a payment as expense but it was a transfer? One tap reclassifies — both legs link, balances reconcile, analytics updates.`,
        primaryKeyword: 'convert expense to transfer',
        seoKeywords: [
            'convert expense to transfer',
            'reclassify transaction app',
            'transaction-to-transfer converter',
            'transfer reclassification',
            'expense to transfer'
        ],
        relatedFeatureSlugs: ['account-transfers', 'transfer-pair-detection'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'mint-alternatives-developers'],
        publishedAt: '2026-01-05',
        updatedAt: '2026-05-03',
        ogTags: ['transfer', 'convert', 'reclassify']
    },
    {
        slug: 'convert-to-refund',
        tier: FeatureTierEnum.NICHE,
        title: msg`Convert Income to Refund`,
        tagline: msg`Link refund income back to the expense it reverses — full or partial, automatic or manual, always reversible.`,
        metaTitle: msg`Convert Income to Refund in Expense App — Budgie`,
        metaDescription: msg`Budgie links refund income back to the original expense, supports partial refunds, searches same-currency expenses across accounts, and keeps analytics clean.`,
        primaryKeyword: 'convert income to refund',
        seoKeywords: [
            'convert income to refund',
            'refund handling expense tracker',
            'partial refund tracker',
            'fix miscategorized income',
            'refund matching expense app'
        ],
        relatedFeatureSlugs: ['transfer-pair-detection', 'expense-tracking', 'transaction-long-press-menu', 'spending-analytics'],
        relatedArticleSlugs: ['budgie-offline-financial-data'],
        publishedAt: '2026-05-25',
        updatedAt: '2026-05-25',
        ogTags: ['refunds', 'analytics', 'cleanup']
    },
    {
        slug: 'screenshot-protection',
        tier: FeatureTierEnum.NICHE,
        title: msg`Screenshot Protection — Hide Bank Balance from Previews`,
        tagline: msg`Accidental shares stay private — balances blur in screenshots and the app switcher.`,
        metaTitle: msg`Screenshot Protection — Budgie`,
        metaDescription: msg`Sensitive balances and amounts blur automatically in screenshots and the app switcher preview. Configurable per screen.`,
        primaryKeyword: 'hide bank balance screenshot',
        seoKeywords: [
            'hide bank balance screenshot',
            'screenshot protection finance app',
            'app switcher blur',
            'private balance app',
            'no-screenshot finance app'
        ],
        relatedFeatureSlugs: ['pin-app-lock', 'biometric-authentication'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'cloud-budgeting-privacy-risks'],
        publishedAt: '2025-12-23',
        updatedAt: '2026-05-03',
        ogTags: ['privacy', 'screenshots', 'security']
    },
    {
        slug: 'crypto-investment-tracking',
        tier: FeatureTierEnum.NICHE,
        title: msg`Crypto, Stocks, ETFs — All In One Place`,
        tagline: msg`Bitcoin to ETFs in one dashboard, alongside your bank accounts.`,
        metaTitle: msg`Crypto & Investment Tracking — Budgie`,
        metaDescription: msg`Track Bitcoin, Ethereum, AAPL, S&P 500 ETFs, and gold alongside bank accounts in a single net-worth view. Each holding is an instrument + quantity + price.`,
        primaryKeyword: 'crypto portfolio tracker app',
        seoKeywords: [
            'crypto portfolio tracker app',
            'crypto + bank tracker',
            'investment tracker mobile',
            'ETF portfolio app',
            'multi-asset net worth'
        ],
        relatedFeatureSlugs: ['net-worth-tracker', 'account-management', 'multi-currency'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-11-17',
        updatedAt: '2026-05-03',
        ogTags: ['crypto', 'stocks', 'etf']
    },
    {
        slug: 'dark-mode',
        tier: FeatureTierEnum.NICHE,
        title: msg`True Dark Mode (Not Just Dimmed)`,
        tagline: msg`OLED-friendly black, locale-aware, no white flash on cold launch.`,
        metaTitle: msg`Dark Mode Budget App — Easy on the Eyes — Budgie`,
        metaDescription: msg`System-adaptive dark theme that respects OLED displays. Switch with your device, or lock to dark or light. Charts recompute palette for legibility.`,
        primaryKeyword: 'dark mode expense tracker',
        seoKeywords: [
            'dark mode expense tracker',
            'OLED budget app',
            'system theme finance app',
            'dark mode finance app',
            'true black expense app'
        ],
        relatedFeatureSlugs: ['multi-language-app'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-11-17',
        updatedAt: '2026-05-03',
        ogTags: ['dark mode', 'ui', 'theme']
    },
    {
        slug: 'multi-language-app',
        tier: FeatureTierEnum.NICHE,
        title: msg`Budgie in Five Languages`,
        tagline: msg`English, Ukrainian, French, German, Spanish — full UI, locale-aware formatting.`,
        metaTitle: msg`Multi-Language App — Budgie`,
        metaDescription: msg`Full UI in English, Ukrainian, French, German, and Spanish. Auto-detected from device locale, switchable in-app — no reinstall, no relaunch.`,
        primaryKeyword: 'multilingual budget app',
        seoKeywords: [
            'multilingual budget app',
            '5 languages expense tracker',
            'localized finance app',
            'i18n budget app',
            'language switcher expense app'
        ],
        relatedFeatureSlugs: ['ai-merchant-translation', 'dark-mode'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2025-11-17',
        updatedAt: '2026-05-03',
        ogTags: ['i18n', 'languages', 'multilingual']
    },
    {
        slug: 'primary-tag',
        tier: FeatureTierEnum.NICHE,
        title: msg`Primary Tag — Label Transactions for Quick Scanning`,
        tagline: msg`One badge. Scan a long list at a glance.`,
        metaTitle: msg`Primary Tag — Quick-Scan Transaction Labeling — Budgie`,
        metaDescription: msg`Promote one tag per transaction to "primary" — it pins as a corner-star badge so you can scan #vacation or #shared at a glance without opening rows.`,
        primaryKeyword: 'label transactions quickly',
        seoKeywords: [
            'label transactions quickly',
            'primary tag finance app',
            'visual transaction tag',
            'corner star badge expense',
            'primary tag picker'
        ],
        relatedFeatureSlugs: ['transaction-tags', 'tag-analytics'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2026-04-24',
        updatedAt: '2026-05-03',
        ogTags: ['tags', 'ui', 'scanning']
    },
    {
        slug: 'private-budget-app-alternative',
        tier: FeatureTierEnum.HERO,
        category: FeatureCategoryEnum.COMPARISON,
        title: msg`Private Budget App — A Cloud-Free Alternative`,
        tagline: msg`Cloud-based personal finance apps mirror every transaction to their servers. Budgie keeps your ledger on your device. No account, no aggregator, no exposure.`,
        metaTitle: msg`Private Budget App — Cloud-Free Alternative — Budgie`,
        metaDescription: msg`Tired of cloud-based PFM apps holding your transactions? Budgie is offline-first, no account, no aggregator. Your financial data stays on your phone.`,
        primaryKeyword: 'private alternative cloud budget app',
        seoKeywords: [
            'private budget app',
            'cloud budget app alternative',
            'no cloud expense tracker',
            'private personal finance app',
            'no aggregator budget app'
        ],
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'database-backup', 'pin-app-lock'],
        relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'budgie-offline-financial-data', 'mint-shutdown-private-alternative'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['privacy', 'comparison', 'alternative']
    },
    {
        slug: 'subscription-free-budget-app',
        tier: FeatureTierEnum.HERO,
        category: FeatureCategoryEnum.COMPARISON,
        title: msg`Subscription-Free Budget App — Pay Once or Free`,
        tagline: msg`Recurring monthly fees turn budgeting into another bill. Budgie's core is free; advanced features unlock with a one-time purchase you actually own.`,
        metaTitle: msg`Budget App No Subscription — Free Core, One-Time Pro — Budgie`,
        metaDescription: msg`Stop paying monthly to track your money. Budgie's core features are free; the optional one-time unlock is yours forever. Offline-first and private.`,
        primaryKeyword: 'budget app no subscription',
        seoKeywords: [
            'budget app no subscription',
            'one-time purchase budget app',
            'no monthly fee expense tracker',
            'pay once finance app',
            'no subscription personal finance'
        ],
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'monobank-sync', 'spending-analytics', 'open-source-budget-app-mobile'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['pricing', 'comparison', 'subscription-free']
    },
    {
        slug: 'no-bank-login-budget-app',
        tier: FeatureTierEnum.CORE,
        category: FeatureCategoryEnum.COMPARISON,
        title: msg`Budget App Without Bank Login — Direct API or Statement Import`,
        tagline: msg`Aggregators sit between you and your bank, mirroring every transaction to their servers. Budgie talks to your bank directly via tokens or imports statements you download yourself.`,
        metaTitle: msg`Budget App Without Bank Login — No Aggregator — Budgie`,
        metaDescription: msg`Skip the aggregator. Budgie syncs Monobank via your personal API token and imports any bank's PDF or CSV statement directly. Your credentials never leave you.`,
        primaryKeyword: 'budget app without bank login',
        seoKeywords: [
            'budget app without bank login',
            'no aggregator expense tracker',
            'budget app without credentials',
            'self-import bank statement app',
            'direct bank api budget app'
        ],
        relatedFeatureSlugs: [
            'monobank-sync',
            'csv-import',
            'erste-bank-pdf-import',
            'privatbank-import',
            'private-budget-app-alternative'
        ],
        relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'offline-first-bank-data-safety'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['privacy', 'aggregator', 'bank-sync']
    },
    {
        slug: 'open-source-budget-app-mobile',
        tier: FeatureTierEnum.CORE,
        category: FeatureCategoryEnum.COMPARISON,
        title: msg`Source-Available Budget App for Mobile — Audit, Fork, Trust`,
        tagline: msg`Closed-source finance apps ask you to trust marketing. Budgie's mobile app has public source, so the privacy and security claims are auditable line by line.`,
        metaTitle: msg`Source-Available Mobile Budget App — Auditable Privacy — Budgie`,
        metaDescription: msg`Budgie is a source-available mobile budget app. Read the network code, verify the offline-first claims, fork it if we ever go in the wrong direction.`,
        primaryKeyword: 'source available mobile budget app',
        seoKeywords: [
            'source available mobile budget app',
            'auditable budget app',
            'public source iOS budget app',
            'public source Android budget app',
            'GitHub budget app'
        ],
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'private-budget-app-alternative', 'self-hosted-finance-app-mobile'],
        relatedArticleSlugs: ['open-source-budgeting-transparency'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['open-source', 'transparency', 'github']
    },
    {
        slug: 'self-hosted-finance-app-mobile',
        tier: FeatureTierEnum.POWER,
        category: FeatureCategoryEnum.COMPARISON,
        title: msg`Self-Hosted Finance App on Mobile — Without Running a Server`,
        tagline: msg`Self-hosting promises privacy but ships a server you have to babysit. Budgie gives you the same data ownership with zero ops — your phone is the server.`,
        metaTitle: msg`Self-Hosted Budget App Mobile — No Server Needed — Budgie`,
        metaDescription: msg`Get the privacy of self-hosted finance apps without running a server. Budgie's data lives on your phone; your cloud handles backups. Zero ops, full ownership.`,
        primaryKeyword: 'self-hosted budget mobile app',
        seoKeywords: [
            'self-hosted budget mobile app',
            'self-hosted finance no server',
            'no server budget app',
            'on-device personal finance',
            'mobile-first self-hosted'
        ],
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'database-backup', 'data-export', 'open-source-budget-app-mobile'],
        relatedArticleSlugs: ['local-first-movement-developers', 'budgie-offline-financial-data'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['self-hosted', 'privacy', 'no-server']
    },
    {
        slug: 'on-device-ai-budget-app',
        tier: FeatureTierEnum.HERO,
        category: FeatureCategoryEnum.COMPARISON,
        title: msg`On-Device AI Budget App — Local LLM, No Cloud Inference`,
        tagline: msg`Cloud AI assistants for budgeting send every transaction to a remote server for "intelligence". Budgie runs the LLM and embeddings on your phone — your data never leaves.`,
        metaTitle: msg`On-Device AI Budget App — Private LLM Categorization — Budgie`,
        metaDescription: msg`Budgie runs a 1.7B-parameter LLM and 768-dim embedding model on your phone for categorization, tag suggestions, and voice entry. No cloud AI, ever.`,
        primaryKeyword: 'on-device AI budget app',
        seoKeywords: [
            'on-device AI budget app',
            'private AI finance app',
            'local LLM expense tracker',
            'on-device AI categorization',
            'no cloud AI budget app'
        ],
        relatedFeatureSlugs: [
            'ai-auto-categorization',
            'voice-transaction-entry',
            'ai-transaction-suggestions',
            'ai-tag-suggestions',
            'ai-merchant-translation'
        ],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app', 'on-device-ai-budget-app-explainer'],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07',
        ogTags: ['ai', 'on-device', 'privacy', 'llm']
    }
] as const;
/* eslint-enable lingui/no-unlocalized-strings */
