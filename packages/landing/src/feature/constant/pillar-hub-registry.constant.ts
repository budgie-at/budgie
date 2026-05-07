/* eslint-disable lingui/no-unlocalized-strings */
import { msg } from '@lingui/core/macro';

import type { PillarHubEntryInterface } from '../interface/pillar-hub-entry.interface';

export const PILLAR_HUB_REGISTRY: readonly PillarHubEntryInterface[] = [
    {
        slug: 'privacy',
        title: msg`Private Expense Tracker — On Your Device, Off the Cloud`,
        tagline: msg`No account. No aggregator. No telemetry. Six features that make Budgie the most private expense tracker on iOS and Android.`,
        metaTitle: msg`Private Expense Tracker — On-Device — Budgie`,
        metaDescription: msg`Budgie is a private expense tracker by architecture: encrypted on-device storage, no account, no aggregator, biometric lock, screenshot protection, and your own cloud backups.`,
        primaryKeyword: 'private expense tracker',
        seoKeywords: [
            'private expense tracker',
            'no account budget app',
            'no telemetry finance app',
            'on-device expense tracker',
            'no cloud budget app'
        ],
        memberFeatureSlugs: [
            'offline-first-expense-tracker',
            'pin-app-lock',
            'biometric-authentication',
            'screenshot-protection',
            'data-export',
            'database-backup'
        ],
        heroBullets: [
            msg`Encrypted SQLite on your device — no cloud copy ever`,
            msg`No account required to start tracking`,
            msg`Biometric and PIN locks before any transaction view`,
            msg`Screenshot blur on balance fields and app-switcher previews`,
            msg`Backups to your own iCloud Drive, Google Drive, or Dropbox`
        ],
        faqs: [
            {
                question: msg`Does Budgie send any financial data to a server?`,
                answer: msg`No. Every transaction, category, and balance lives in an encrypted SQLite database on your device. Budgie has no backend that receives financial data.`
            },
            {
                question: msg`Do I need to create an account to use Budgie?`,
                answer: msg`No account is required. You open the app and start tracking immediately. There is no sign-up screen, no email address collected, and no session token ever sent to our servers.`
            },
            {
                question: msg`Where are my backups stored?`,
                answer: msg`Backups go to your personal cloud storage — iCloud Drive on iOS, or Google Drive or Dropbox on Android. Budgie never receives a copy; you own every byte.`
            },
            {
                question: msg`Does Budgie use any analytics or crash-reporting SDKs?`,
                answer: msg`Budgie ships with zero third-party analytics or advertising SDKs. Crash reporting is opt-in and anonymized; financial data is never included.`
            },
            {
                question: msg`How is the on-device database encrypted?`,
                answer: msg`Budgie uses SQLCipher-backed SQLite with AES-256 encryption. The encryption key is derived from your device keychain and is never transmitted off the device.`
            }
        ],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07'
    },
    {
        slug: 'offline-first',
        title: msg`Offline Budget App — Track Expenses Without Internet`,
        tagline: msg`Every transaction is stored locally. No Wi-Fi required to add expenses, view balances, or import bank data. Works anywhere.`,
        metaTitle: msg`Offline Budget App — Works Without Internet — Budgie`,
        metaDescription: msg`Budgie is a fully offline budget app. Add expenses, view analytics, and import bank statements without any internet connection. Your data stays on your device.`,
        primaryKeyword: 'offline budget app',
        seoKeywords: [
            'offline budget app',
            'offline expense tracker',
            'no internet budget app',
            'budget app without wifi',
            'local expense tracker'
        ],
        memberFeatureSlugs: [
            'offline-first-expense-tracker',
            'csv-import',
            'erste-bank-pdf-import',
            'multi-currency',
            'database-backup'
        ],
        heroBullets: [
            msg`Full expense tracking with zero internet dependency`,
            msg`Import bank CSVs and PDFs without a cloud connection`,
            msg`Multi-currency exchange rates cached locally for offline use`,
            msg`Analytics, charts, and reports work entirely on-device`,
            msg`Encrypted local backups you can restore without a server`
        ],
        faqs: [
            {
                question: msg`Can I add transactions without an internet connection?`,
                answer: msg`Yes. The entire transaction entry flow — amount, category, tags, account — works fully offline. Your data is written directly to the on-device SQLite database with no network call.`
            },
            {
                question: msg`How does multi-currency work offline?`,
                answer: msg`Exchange rates are fetched and cached locally when you have connectivity. You can continue converting currencies offline using the last-fetched rates, with a visible timestamp so you always know their age.`
            },
            {
                question: msg`Can I import bank statements without Wi-Fi?`,
                answer: msg`CSV and PDF files already on your device can be imported offline. Monobank sync requires a brief network call to Monobank's API, but every other import source works locally.`
            },
            {
                question: msg`Will my analytics still work offline?`,
                answer: msg`All charts, category breakdowns, tag analytics, and net-worth calculations run against the local database. They work identically whether you are connected or not.`
            },
            {
                question: msg`What happens to my data if I lose internet for weeks?`,
                answer: msg`Nothing happens — your data is safe on-device. You can keep adding transactions, reviewing history, and running reports with no interruption. Sync features like Monobank simply wait until you reconnect.`
            }
        ],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07'
    },
    {
        slug: 'ai-features',
        title: msg`On-Device AI Finance — Private AI for Your Money`,
        tagline: msg`Qwen3 1.7B and a 768-dim embedding model run entirely on your phone. Smart suggestions, voice entry, and auto-categorization — no data leaves your device.`,
        metaTitle: msg`On-Device AI Finance App — Private AI — Budgie`,
        metaDescription: msg`Budgie runs Qwen3 1.7B and a 768-dim embedding model locally. AI auto-categorization, voice transaction entry, and merchant translation without sending data to the cloud.`,
        primaryKeyword: 'on-device AI finance',
        seoKeywords: [
            'on-device AI finance',
            'private AI budget app',
            'local LLM expense tracker',
            'AI auto-categorization app',
            'offline AI finance app'
        ],
        memberFeatureSlugs: [
            'ai-auto-categorization',
            'voice-transaction-entry',
            'ai-merchant-translation',
            'ai-transaction-suggestions',
            'ai-tag-suggestions',
            'mcc-auto-category'
        ],
        heroBullets: [
            msg`Qwen3 1.7B runs on your phone — no API key, no subscription`,
            msg`768-dimensional embedding model for instant category suggestions`,
            msg`Voice transaction entry via whisper.rn — audio never leaves the device`,
            msg`Merchant name normalization for Cyrillic and foreign bank statements`,
            msg`Every AI correction improves future suggestions via on-device learning`
        ],
        faqs: [
            {
                question: msg`Which AI models does Budgie use?`,
                answer: msg`Budgie uses two on-device models: Qwen3 1.7B for natural-language understanding and chat, and a 768-dimensional embedding model for nearest-neighbor categorization from your own transaction history. Both run locally with no external API call.`
            },
            {
                question: msg`How large are the model downloads?`,
                answer: msg`The embedding model is approximately 90 MB. Qwen3 1.7B in quantized form is approximately 1.1 GB. Both are downloaded once on first use of AI features and cached on-device.`
            },
            {
                question: msg`Does voice entry send audio to a server?`,
                answer: msg`No. Voice entry uses whisper.rn — a React Native binding for whisper.cpp — which transcribes audio directly on your device. Your voice recordings are never streamed to any external server.`
            },
            {
                question: msg`What languages does the AI support?`,
                answer: msg`Categorization and suggestions work in any language because they are driven by your own history. Voice entry supports English, Ukrainian, German, French, and Spanish as primary languages, with Whisper-small providing broader coverage for other languages.`
            },
            {
                question: msg`How does AI improve over time?`,
                answer: msg`Every time you accept, edit, or reject a category suggestion, the embedding model index updates locally. The more you use Budgie, the more accurately the embedding model mirrors your personal spending patterns.`
            }
        ],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07'
    },
    {
        slug: 'security',
        title: msg`Encrypted Budget App — Lock Down Your Financial Data`,
        tagline: msg`PIN, biometrics, screenshot protection, and AES-256 encrypted storage. Budgie secures your financial data at every layer.`,
        metaTitle: msg`Encrypted Budget App — Biometric Lock — Budgie`,
        metaDescription: msg`Budgie protects your finances with AES-256 encrypted SQLite, biometric and PIN lock, screenshot blur, and encrypted cloud backups. No server ever sees your data.`,
        primaryKeyword: 'encrypted budget app',
        seoKeywords: [
            'encrypted budget app',
            'secure expense tracker',
            'biometric finance app',
            'PIN lock budget app',
            'encrypted finance app'
        ],
        memberFeatureSlugs: [
            'pin-app-lock',
            'biometric-authentication',
            'screenshot-protection',
            'database-backup'
        ],
        heroBullets: [
            msg`AES-256 encrypted SQLite — your database is unreadable without your key`,
            msg`PIN lock enforced before any transaction or balance is visible`,
            msg`Face ID and fingerprint authentication on every supported device`,
            msg`Automatic screenshot blur hides balances in the iOS and Android app switcher`,
            msg`Backups are encrypted before leaving your device — the key stays with you`
        ],
        faqs: [
            {
                question: msg`How is the database encrypted?`,
                answer: msg`Budgie stores all financial data in an SQLCipher-backed SQLite database encrypted with AES-256. The encryption key is derived from your device keychain and never transmitted off the device.`
            },
            {
                question: msg`What happens if someone picks up my unlocked phone?`,
                answer: msg`Budgie's PIN and biometric lock gate every app launch. Even if the device is unlocked, no financial data is visible until the correct PIN or biometric challenge is passed.`
            },
            {
                question: msg`Can someone see my balance in the app switcher?`,
                answer: msg`No. Screenshot protection automatically blurs all sensitive screens when the app moves to the background, preventing balance exposure in the iOS and Android recent-apps view.`
            },
            {
                question: msg`Are my encrypted backups safe if someone accesses my cloud storage?`,
                answer: msg`Yes. Backups are encrypted on your device before upload using your device-derived key. Anyone with access to your iCloud Drive or Google Drive would only see an encrypted blob — not your financial data.`
            },
            {
                question: msg`Does Budgie have any server-side security risks?`,
                answer: msg`No. Because Budgie stores all data locally and has no backend that receives financial information, there is no server to breach. The entire attack surface is limited to your device.`
            }
        ],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07'
    },
    {
        slug: 'open-source',
        title: msg`Open Source Personal Finance — Transparent by Design`,
        tagline: msg`Budgie's core is open source. Audit the code, verify our privacy claims, and contribute — because your financial app should have nothing to hide.`,
        metaTitle: msg`Open Source Personal Finance App — Budgie`,
        metaDescription: msg`Budgie is an open source personal finance app. Read the source, audit privacy claims, contribute features, and trust your expense tracker because you can verify it.`,
        primaryKeyword: 'open source personal finance',
        seoKeywords: [
            'open source personal finance',
            'open source budget app',
            'open source expense tracker',
            'transparent finance app',
            'auditable budget app'
        ],
        memberFeatureSlugs: [],
        heroBullets: [
            msg`Source code is publicly available — read every line that touches your data`,
            msg`Privacy claims are verifiable, not just promised`,
            msg`Community contributions welcome — features built by people who use the app`,
            msg`MIT-licensed core with no proprietary data lock-in`,
            msg`Transparent roadmap and public issue tracker`
        ],
        faqs: [
            {
                question: msg`Where can I find Budgie's source code?`,
                answer: msg`Budgie's source code is hosted on GitHub. You can browse, fork, and contribute at github.com/goncharovnikita/budgie. The repository includes the full app, AI service layer, contracts, and landing page.`
            },
            {
                question: msg`What license does Budgie use?`,
                answer: msg`Budgie is released under the MIT License. You are free to use, modify, and distribute the code with attribution. There are no proprietary modules that touch your financial data.`
            },
            {
                question: msg`How does open source make Budgie more private?`,
                answer: msg`Open source means our privacy claims are verifiable. Any developer can audit the code and confirm that no financial data is transmitted to external servers. You do not have to trust us — you can check.`
            },
            {
                question: msg`Can I contribute to Budgie?`,
                answer: msg`Yes. Pull requests, bug reports, and feature suggestions are welcome on the GitHub repository. The project follows a standard fork-and-PR workflow with contribution guidelines in the repository.`
            },
            {
                question: msg`Is the AI model integration also open source?`,
                answer: msg`Yes. The AI service layer — including the embedding model integration and LLM orchestration — is part of the open source repository. The underlying models (Qwen3, whisper.rn) are separately licensed open source projects.`
            }
        ],
        publishedAt: '2026-05-07',
        updatedAt: '2026-05-07'
    }
];
