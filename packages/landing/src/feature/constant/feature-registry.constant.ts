import { msg } from '@lingui/core/macro';

import { FeatureTierEnum } from './feature-tier.enum';

import type { FeatureRegistryEntryInterface } from '../interface/feature-registry-entry.interface';

/* eslint-disable lingui/no-unlocalized-strings, max-lines */
export const FEATURE_REGISTRY: readonly FeatureRegistryEntryInterface[] = [
    {
        slug: 'offline-first-expense-tracker',
        tier: FeatureTierEnum.HERO,
        title: msg`Offline-First Expense Tracker`,
        tagline: msg`Every transaction lives on your device. No cloud account, no sign-up.`,
        metaTitle: msg`Offline-First Expense Tracker — Budgie`,
        metaDescription: msg`Budgie is a 100% offline-first expense tracker. Your financial data never leaves your phone — encrypted SQLite, no servers, no account required.`,
        primaryKeyword: 'offline expense tracker app',
        seoKeywords: [
            'offline expense tracker',
            'offline budget app',
            'private finance app',
            'no account budget app',
            'local-first expense tracker'
        ],
        heroBenefits: [
            msg`Works in airplane mode, tunnels, and rural areas — every feature, every time`,
            msg`No sign-up, no email, no account — install and start logging`,
            msg`AES-256 encrypted SQLite database, key derived from your PIN`,
            msg`No backend means no breach surface — there is nothing to leak`,
            msg`Optional bank sync uses your own API tokens — never a third-party aggregator`
        ],
        relatedFeatureSlugs: ['monobank-sync', 'ai-auto-categorization', 'pin-app-lock', 'database-backup'],
        relatedArticleSlugs: ['offline-first-privacy-financial-app', 'budgie-offline-financial-data'],
        faqs: [
            {
                question: msg`Does Budgie work without internet?`,
                answer: msg`Yes, fully. Every core feature — logging expenses, viewing analytics, managing categories — runs entirely on your device. Internet is only used when you opt in to bank sync, AI model downloads, or exchange-rate updates.`
            },
            {
                question: msg`What happens if I lose my phone?`,
                answer: msg`Without a backup file, your data is gone — that's the privacy trade-off. Budgie offers a one-tap encrypted database backup you can save to iCloud Drive, Google Drive, or anywhere else. Restore on a new device with one tap.`
            },
            {
                question: msg`Is bank sync still offline?`,
                answer: msg`Bank sync requires internet to fetch new transactions, but everything else continues working offline. Once synced, your bank data lives on-device alongside manual entries.`
            },
            {
                question: msg`What's the catch with offline-first?`,
                answer: msg`The trade-off is multi-device sync — there's no automatic sync via our servers because we don't have any. Use a backup file copied through your own cloud storage if you need to move between devices.`
            }
        ],
        publishedAt: '2025-12-01',
        updatedAt: '2026-05-03',
        ogTags: ['offline-first', 'privacy', 'expense tracker']
    },
    {
        slug: 'monobank-sync',
        tier: FeatureTierEnum.HERO,
        title: msg`Monobank Bank Sync`,
        tagline: msg`Direct API. No aggregator. Full transaction history to your device.`,
        metaTitle: msg`Monobank Auto-Sync — Budgie`,
        metaDescription: msg`Connect your Monobank account directly via personal API token. Full transaction history, FX rates, and counter-IBANs synced straight to your device — never via Plaid.`,
        primaryKeyword: 'monobank expense tracker',
        seoKeywords: [
            'monobank sync',
            'monobank api',
            'monobank expense tracker',
            'monobank transaction import',
            'monobank budget app'
        ],
        heroBenefits: [
            msg`Direct Monobank Personal API — your token, your call`,
            msg`Full historical sync on first connect, then incremental every 30 minutes`,
            msg`Cross-currency transactions preserve original FX rate per leg`,
            msg`Counter-IBAN stored, enabling smart transfer-pair consolidation`,
            msg`Windowed re-sync to fix drift without losing manual edits`
        ],
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'transfer-pair-detection', 'bank-resync-window', 'mcc-auto-category', 'csv-import'],
        relatedArticleSlugs: ['cloud-budgeting-privacy-risks', 'budgie-offline-financial-data'],
        faqs: [
            {
                question: msg`How is this different from Plaid-based apps?`,
                answer: msg`Plaid sits between you and your bank, mirroring all your transactions to its servers. Budgie talks to Monobank's API directly from your phone using your token. Monobank sees the request; nothing else.`
            },
            {
                question: msg`Where does my Monobank token live?`,
                answer: msg`In your platform's secure keystore (iOS Keychain / Android Keystore), never in plaintext or our servers (we have none).`
            },
            {
                question: msg`Can I use multiple Monobank accounts?`,
                answer: msg`Yes — one token grants access to all your Monobank accounts. Pick which to import per account.`
            },
            {
                question: msg`What if Monobank's API changes?`,
                answer: msg`Budgie is open source. The Monobank integration lives in packages/bank-sync/src/monobank/ and the project's release cadence keeps it current.`
            }
        ],
        publishedAt: '2025-12-25',
        updatedAt: '2026-05-03',
        ogTags: ['monobank', 'bank sync', 'privacy']
    },
    {
        slug: 'ai-auto-categorization',
        tier: FeatureTierEnum.HERO,
        title: msg`On-Device AI Auto-Categorization`,
        tagline: msg`A 1.7B-parameter model on your phone — never a remote server.`,
        metaTitle: msg`On-Device AI Auto-Categorization — Budgie`,
        metaDescription: msg`Budgie's on-device 1.7B LLM and embedding model categorize new transactions privately. Your statements never touch a server. Vector search plus a generative pass.`,
        primaryKeyword: 'AI expense categorization',
        seoKeywords: [
            'AI expense categorization',
            'on-device AI budget app',
            'private AI finance',
            'local LLM expense tracker',
            'machine learning expense categorization'
        ],
        heroBenefits: [
            msg`Qwen3 1.7B Q4 model runs entirely on your phone after a one-time download`,
            msg`Nomic embedding model + sqlite-vec for SIMD-accelerated similarity search`,
            msg`Two complementary signals: vector lookup over your history plus a generative tag suggestion`,
            msg`Every confirmation updates the embedding index instantly — accuracy improves as you use it`,
            msg`Statements never leave the device — no OpenAI, no remote inference, ever`
        ],
        relatedFeatureSlugs: ['offline-first-expense-tracker', 'voice-transaction-entry', 'ai-merchant-translation', 'mcc-auto-category', 'custom-categories'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        faqs: [
            {
                question: msg`Does the AI work offline?`,
                answer: msg`Yes. The model and embeddings live on your device after the one-time download. Categorization runs whether you're online or not.`
            },
            {
                question: msg`How big is the model download?`,
                answer: msg`Roughly 1 GB combined for the language model and the embedding model. The download happens on first use of AI features and is fully optional — you can keep using Budgie without AI.`
            },
            {
                question: msg`Can I correct the AI's suggestions?`,
                answer: msg`Always. Every transaction lets you accept, edit, or reject the suggestion. Your corrections feed back into the embedding index immediately so the next similar transaction lands closer to the right category.`
            },
            {
                question: msg`Does Budgie use OpenAI or any cloud LLM?`,
                answer: msg`No. Inference uses ONNX Runtime locally. There is no fallback to a cloud model and no telemetry about your transactions.`
            }
        ],
        publishedAt: '2026-02-06',
        updatedAt: '2026-05-03',
        ogTags: ['ai', 'on-device', 'privacy']
    },
    {
        slug: 'voice-transaction-entry',
        tier: FeatureTierEnum.HERO,
        title: msg`Voice Transaction Entry`,
        tagline: msg`Speak it. Budgie logs it. Audio never leaves your phone.`,
        metaTitle: msg`Voice-to-Expense, On-Device — Budgie`,
        metaDescription: msg`Say "twelve dollars coffee this morning" and Budgie logs it. Whisper speech-to-text and the on-device LLM both run locally — no audio ever streams to a server.`,
        primaryKeyword: 'voice expense tracker',
        seoKeywords: [
            'voice expense tracker',
            'voice budget app',
            'speech-to-text expenses',
            'voice transaction logging',
            'on-device whisper'
        ],
        heroBenefits: [
            msg`Whisper-small runs locally for accurate, multilingual transcription`,
            msg`On-device LLM extracts amount, merchant, date, and category from natural speech`,
            msg`Audio never leaves the device — no Siri-style cloud round-trip`,
            msg`Pre-fills the same quick-entry form you would use by typing — confirm or correct`,
            msg`Works during the AI model loading phase too — visual progress indicator built-in`
        ],
        relatedFeatureSlugs: ['ai-auto-categorization', 'expense-tracking', 'ai-merchant-translation'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        faqs: [
            {
                question: msg`Which languages does voice entry support?`,
                answer: msg`Whisper-small supports the languages it ships with — including English, Ukrainian, German, French, Spanish, and dozens more. Transcription quality scales with language coverage in the model.`
            },
            {
                question: msg`Is my voice recorded anywhere?`,
                answer: msg`No. The microphone stream feeds Whisper directly in-process; the audio buffer is discarded after transcription. Nothing is saved, sent, or logged.`
            },
            {
                question: msg`What if Whisper mishears me?`,
                answer: msg`The transcription appears in the form before you save. Edit any field manually, or tap the mic again to retry.`
            },
            {
                question: msg`Does it work offline?`,
                answer: msg`Yes — once the Whisper model is cached on-device, voice entry works without any internet connection.`
            }
        ],
        publishedAt: '2026-01-22',
        updatedAt: '2026-05-03',
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
        heroBenefits: [
            msg`Per-account "include in net worth" toggle — partial-truth balance is your call`,
            msg`Daily background FX-rate refresh converts every account to your base currency`,
            msg`Liability and debt accounts subtract automatically; receivables add`,
            msg`Crypto, stocks, ETFs, and commodities sit alongside fiat with the same UX`,
            msg`Tap any aggregated number to drill into the per-leg native amounts`
        ],
        relatedFeatureSlugs: ['account-management', 'multi-currency', 'debt-tracking', 'crypto-investment-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            {
                question: msg`Where do exchange rates come from?`,
                answer: msg`A daily background task pulls rates from a public-domain feed and stores a snapshot per day on your device. No live rate broker is queried at render time.`
            },
            {
                question: msg`Can I exclude an account from net worth?`,
                answer: msg`Yes. Each account has an "Include in net worth" toggle so you can keep, say, a business escrow account separate from your personal balance sheet.`
            },
            {
                question: msg`How do crypto and stock holdings price?`,
                answer: msg`Either by manual price update or by importing your brokerage's CSV export. Live ticker integration is opt-in to keep the offline-first guarantee.`
            },
            {
                question: msg`Is the home screen number always accurate?`,
                answer: msg`As accurate as your most-recent balance + FX rate. Manual accounts hold whatever balance you set; bank-synced accounts reconcile every sync.`
            }
        ],
        publishedAt: '2026-01-03',
        updatedAt: '2026-05-03',
        ogTags: ['net worth', 'multi-currency', 'dashboard']
    }
] as const;
/* eslint-enable lingui/no-unlocalized-strings, max-lines */
