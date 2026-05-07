/* eslint-disable max-lines -- File owns a single feature registry that must stay together */
import { msg } from '@lingui/core/macro';

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
        metaDescription: msg`Budgie's on-device 1.7B LLM and embedding model categorize transactions privately. Your statements never leave the phone — no cloud, no API keys needed.`,
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
            'recurring-payments-calendar'
        ],
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
        faqs: [
            {
                question: msg`How fast is the quick-entry form?`,
                answer: msg`Open the sheet, type the amount, tap save — that's the typical flow once defaults are tuned to your habits. The form picks your default account, the most-likely category, and today's date automatically.`
            },
            {
                question: msg`Can I edit a transaction after saving?`,
                answer: msg`Always. Long-press the row in the list for a context menu with Edit, Delete, Split, and Convert to Transfer actions.`
            },
            {
                question: msg`Does Budgie distinguish transfers from expenses?`,
                answer: msg`Yes. Transfer is a first-class transaction type with explicit source and destination accounts; it never inflates your spending stats.`
            },
            {
                question: msg`What about recurring purchases?`,
                answer: msg`Budgie auto-detects recurring patterns and surfaces them on a dedicated calendar tab. See the Recurring Payments Calendar feature for details.`
            }
        ],
        publishedAt: '2025-12-14',
        updatedAt: '2026-05-03',
        ogTags: ['expense tracking', 'transactions', 'mobile']
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
        faqs: [
            {
                question: msg`Is there a limit on the number of accounts?`,
                answer: msg`No. Add as many as you need — the home screen organizes them by type and provider so the list stays scannable.`
            },
            {
                question: msg`Can I track an account in a different currency?`,
                answer: msg`Yes. Each account has a fixed currency. Daily exchange-rate snapshots convert everything to your base currency for net worth.`
            },
            {
                question: msg`What happens to transactions when I delete an account?`,
                answer: msg`Budgie prompts you to migrate them to another account or wipe them. Archiving is the safer alternative — it hides the account from the home but keeps the data.`
            },
            {
                question: msg`Can I track loans I owe or money owed to me?`,
                answer: msg`Yes. Debt is a dedicated account type with explicit "I owe" / "owes me" direction. See Debt & Loan Tracking for details.`
            }
        ],
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
            'date-filter-presets',
            'recurring-payments-calendar',
            'ai-merchant-translation'
        ],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            {
                question: msg`Can I drill down from a chart to the transactions?`,
                answer: msg`Yes. Tap any category or tag slice to see every transaction that contributed to it during the current period.`
            },
            {
                question: msg`What's an "Untagged" bucket?`,
                answer: msg`A deliberate gap-finder. Transactions without tags accumulate in this bucket so you can spot bookkeeping gaps and tighten them up.`
            },
            {
                question: msg`Can I compare months?`,
                answer: msg`Yes. Switch the date filter between presets like This Month, Last Month, This Year. Compact tile mode also shows period-over-period deltas.`
            },
            {
                question: msg`Are charts rendered offline?`,
                answer: msg`Yes. Analytics reads directly from your local SQLite database — every chart works without internet.`
            }
        ],
        publishedAt: '2025-12-19',
        updatedAt: '2026-05-03',
        ogTags: ['analytics', 'charts', 'drill-down']
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
        relatedFeatureSlugs: ['ai-auto-categorization', 'expense-tracking', 'transaction-tags', 'spending-analytics', 'split-transactions'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            {
                question: msg`Can I rename categories without losing data?`,
                answer: msg`Yes. Rename is non-destructive — every transaction in the category keeps its link via the category ID, not the name.`
            },
            {
                question: msg`What does merging two categories do?`,
                answer: msg`The merged-from category's transactions are reassigned to the merged-into category, and the empty category is deleted. Reversible only by re-categorizing manually.`
            },
            {
                question: msg`How does the popularity sort work?`,
                answer: msg`The selector tracks how often each category is picked and reorders the list so the top tappers stay near the top. The order is per-device.`
            },
            {
                question: msg`Can I import a pre-built category tree?`,
                answer: msg`Not directly, but CSV import with column mapping can populate categories on first import. After that, edit them like any other.`
            }
        ],
        publishedAt: '2025-11-19',
        updatedAt: '2026-05-03',
        ogTags: ['categories', 'custom', 'organization']
    },
    {
        slug: 'transaction-tags',
        tier: FeatureTierEnum.CORE,
        title: msg`Transaction Tags for Multi-Dimensional Tracking`,
        tagline: msg`Layer tags on top of categories — one transaction can be Groceries (category) and #vacation, #shared, #reimbursable (tags).`,
        metaTitle: msg`Transaction Tags — Budgie`,
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
        faqs: [
            {
                question: msg`How are tags different from categories?`,
                answer: msg`Categories answer "what kind of expense"; tags answer "for which project, person, or purpose." Use both together — one transaction can be Groceries (category) AND #vacation #shared (tags).`
            },
            {
                question: msg`How many tags can I add to a transaction?`,
                answer: msg`No limit. Layer as many as you need; one of them can be promoted to "primary" for the at-a-glance badge on the transaction list.`
            },
            {
                question: msg`What does "primary tag" mean?`,
                answer: msg`The primary tag shows as a corner-star badge on the transaction list so you can scan a long list for #vacation or #shared without opening rows. Long-press to rotate which tag is primary.`
            },
            {
                question: msg`Can I rename or merge tags?`,
                answer: msg`Both. Same flow as categories — rename is non-destructive; merge mass-reassigns the transactions and removes the source tag.`
            }
        ],
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
        faqs: [
            {
                question: msg`Why is "transfer" a separate type?`,
                answer: msg`Money moved between your own accounts is not income or expense. Treating transfers as expenses double-counts your spending. Budgie's first-class Transfer type keeps your stats accurate.`
            },
            {
                question: msg`What about cross-currency transfers?`,
                answer: msg`Dual-amount input shows both legs (e.g. $1000 → €925). Pin either side; the FX rate is preserved per leg so reconciliation across currencies stays exact.`
            },
            {
                question: msg`Can I auto-link transfers from my bank?`,
                answer: msg`Yes — see Smart Transfer Consolidation. Bank-synced debits and credits matching by amount, time window, and counter-IBAN auto-merge into a single transfer.`
            },
            {
                question: msg`Can I undo a transfer?`,
                answer: msg`Long-press the transfer in the list and Edit or Delete. The corresponding leg in the destination account stays linked and updates with you.`
            }
        ],
        publishedAt: '2025-12-19',
        updatedAt: '2026-05-03',
        ogTags: ['transfers', 'multi-currency', 'accounts']
    },
    {
        slug: 'csv-import',
        tier: FeatureTierEnum.CORE,
        title: msg`CSV Bank Statement Import`,
        tagline: msg`Any bank, any column order — set it up once per source, then it's two taps from there.`,
        metaTitle: msg`CSV Bank Statement Import — Budgie`,
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
        relatedArticleSlugs: ['mint-alternatives-developers', 'budgie-offline-financial-data'],
        faqs: [
            {
                question: msg`Will it work with my bank?`,
                answer: msg`If your bank exports CSV, yes. The flexible column mapper accommodates any column order, separator, and date format — set up once, save as a preset.`
            },
            {
                question: msg`What happens if I import the same file twice?`,
                answer: msg`Budgie deduplicates by transaction ID. Existing rows are skipped; only new ones insert. Re-importing is safe.`
            },
            {
                question: msg`Does CSV import preserve the original transaction date?`,
                answer: msg`Yes. The mapper captures both booking date and value date when both are present in the CSV; transactions sort by your preference.`
            },
            {
                question: msg`Can I edit transactions after CSV import?`,
                answer: msg`Always. Imported transactions are normal Budgie transactions — edit, split, tag, or convert to transfer just like manual entries.`
            }
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
        faqs: [
            {
                question: msg`Which Erste statement formats are supported?`,
                answer: msg`Both the classic layout and the modern format introduced in 2026 are parsed natively. If Erste rolls out another redesign, the parser updates with the next release.`
            },
            {
                question: msg`Will the parser get my IBAN right?`,
                answer: msg`Yes — IBAN extraction is part of the header parse. The IBAN is stored on the account and enables automatic transfer-pair detection between Erste and other accounts you own.`
            },
            {
                question: msg`Can I re-import the same PDF safely?`,
                answer: msg`Yes. Transactions deduplicate by their booking reference, so re-importing skips known rows and inserts only new ones.`
            },
            {
                question: msg`Does the parser run online?`,
                answer: msg`No. PDF parsing happens entirely on-device — your statement never leaves your phone.`
            }
        ],
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
        faqs: [
            {
                question: msg`How do I export the XLSX from PrivatBank24?`,
                answer: msg`Open privat24.ua in a browser, go to Statements, pick the date range, and use the XLSX export button. Save the file and import via Budgie's Import → PrivatBank flow.`
            },
            {
                question: msg`What about PrivatBank's custom MCC labels?`,
                answer: msg`Budgie maps each PrivatBank category label to the corresponding ISO MCC code, so AI categorization, MCC chips, and analytics all work the same as with other bank-synced data.`
            },
            {
                question: msg`Is the long-press shortcut destructive?`,
                answer: msg`No. Re-import always dedupes by transaction ID, so re-pulling the same file is safe and idempotent.`
            },
            {
                question: msg`Does it work offline?`,
                answer: msg`The parsing step is on-device. You only need internet to download the XLSX from PrivatBank24 in the first place.`
            }
        ],
        publishedAt: '2026-02-02',
        updatedAt: '2026-05-03',
        ogTags: ['privatbank', 'xlsx', 'import']
    },
    {
        slug: 'pin-app-lock',
        tier: FeatureTierEnum.CORE,
        title: msg`PIN App Lock — Locks With the Encryption Key`,
        tagline: msg`The PIN unlocks the app and unlocks SQLCipher — no PIN, no readable database.`,
        metaTitle: msg`PIN App Lock — Budgie`,
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
        faqs: [
            {
                question: msg`What if I forget my PIN?`,
                answer: msg`The PIN is the encryption key — there's no recovery mechanism, by design. Keep your PIN somewhere safe (a password manager works) or use the database backup feature to restore from a known-good state.`
            },
            {
                question: msg`How quickly does the app re-lock?`,
                answer: msg`Re-lock fires when the app goes to background. The inactivity timer is configurable in Settings.`
            },
            {
                question: msg`Is biometric the same as PIN security?`,
                answer: msg`Biometrics unlock a key fragment in the platform Secure Enclave / Keystore that combines with your PIN-derived key. The platform vouches for biometric matching using the same hardware your bank app uses.`
            },
            {
                question: msg`Does the lock work if my phone is jailbroken?`,
                answer: msg`SQLCipher with a strong PIN protects against filesystem-level access, but a jailbroken device with active malware can capture the PIN at entry time. Don't unlock Budgie on a compromised device.`
            }
        ],
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
        faqs: [
            {
                question: msg`Does Budgie store my biometric data?`,
                answer: msg`No. The platform manages biometric matching in the Secure Enclave (iOS) or Keystore (Android). Budgie only receives a yes/no signal plus access to a stored key fragment.`
            },
            {
                question: msg`What if biometrics fail?`,
                answer: msg`The PIN entry screen appears as a fallback. After five biometric failures, the OS itself prompts the device passcode.`
            },
            {
                question: msg`Can I disable biometrics?`,
                answer: msg`Yes — Settings → PIN → toggle off "Unlock with biometrics". The PIN remains active.`
            },
            {
                question: msg`Is Face ID safer than a PIN?`,
                answer: msg`They're complementary. Biometrics are convenient and prevent shoulder-surfing; the PIN is the actual encryption key. Both raise the bar.`
            }
        ],
        publishedAt: '2025-12-18',
        updatedAt: '2026-05-03',
        ogTags: ['biometric', 'face id', 'security']
    },
    {
        slug: 'data-export',
        tier: FeatureTierEnum.CORE,
        title: msg`Export Every Transaction You've Logged`,
        tagline: msg`CSV for spreadsheets. Encrypted database backup for restore. Both yours, never ours.`,
        metaTitle: msg`CSV & Database Export — Budgie`,
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
        faqs: [
            {
                question: msg`Why two export formats?`,
                answer: msg`CSV is for spreadsheets, tax software, and other apps that want flat data. The database backup preserves every relationship and account state for full restore on a new device.`
            },
            {
                question: msg`Is the backup encrypted?`,
                answer: msg`Yes. The backup file is the SQLCipher database with your PIN-derived key intact. Restore on any device by entering the same PIN.`
            },
            {
                question: msg`Can I import the CSV back into Budgie?`,
                answer: msg`The CSV-import feature handles any flat CSV including ones Budgie produced — useful for round-tripping or merging databases.`
            },
            {
                question: msg`Does export work offline?`,
                answer: msg`Yes. Both export flows produce files locally; you only need internet to upload them to a remote storage service.`
            }
        ],
        publishedAt: '2025-12-21',
        updatedAt: '2026-05-03',
        ogTags: ['export', 'csv', 'backup']
    },
    {
        slug: 'database-backup',
        tier: FeatureTierEnum.CORE,
        title: msg`Database Backup & Restore`,
        tagline: msg`One encrypted file. No account. Restore on any device in seconds.`,
        metaTitle: msg`Database Backup & Restore — Budgie`,
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
        faqs: [
            {
                question: msg`How do I restore on a new device?`,
                answer: msg`Install Budgie on the new phone. On the welcome screen, tap Restore. Pick the backup file from Files / iCloud / Drive. Enter your original PIN. Done.`
            },
            {
                question: msg`Is the backup file safe to upload to a cloud?`,
                answer: msg`Yes — the file is SQLCipher-encrypted with your PIN-derived key. Cloud providers see encrypted bytes, not your transactions.`
            },
            {
                question: msg`Can I have multiple backups?`,
                answer: msg`Yes — every backup is a separate file. Snapshot before risky imports or migrations and keep the file around for rollback.`
            },
            {
                question: msg`Does Budgie auto-backup?`,
                answer: msg`Manual backups only by default — for the privacy-first crowd that doesn't want surprise file writes. You can schedule reminders in Settings.`
            }
        ],
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
        relatedFeatureSlugs: ['spending-analytics', 'recurring-payments-calendar', 'tag-analytics', 'mcc-auto-category'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            {
                question: msg`Can I customize the week start?`,
                answer: msg`Yes — Settings → Display → Start of Week. Override the locale default with Monday or Sunday.`
            },
            {
                question: msg`Are the presets the same on every screen?`,
                answer: msg`Yes. One picker component is reused across analytics tabs, the transaction list, and the recurring calendar. Filters apply consistently.`
            },
            {
                question: msg`What does "All Time" cover?`,
                answer: msg`Every transaction in your database. Useful for full-history analytics or one-off audits.`
            },
            {
                question: msg`Can I save a custom range?`,
                answer: msg`Custom ranges are session-scoped today. Saved custom ranges are on the roadmap for a future release.`
            }
        ],
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
        metaDescription: msg`Budgie auto-detects subscription and recurring-payment patterns from your history, plots them on a month calendar, and forecasts what's coming in the next 60 days.`,
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
        faqs: [
            {
                question: msg`How does Budgie know what's recurring?`,
                answer: msg`A background scan looks at your transaction history for amount + cadence patterns: same vendor, similar amount, regular interval. Confidence scores filter out one-off matches.`
            },
            {
                question: msg`What about cross-currency subscriptions?`,
                answer: msg`Recurring entries show in your home currency on the calendar; tap any entry to see the original amount and currency.`
            },
            {
                question: msg`Can I edit a detected pattern?`,
                answer: msg`Yes. Tap a pattern to adjust amount, cadence, or merchant. Manual edits are sticky — the next scan respects them.`
            },
            {
                question: msg`How far does the forecast go?`,
                answer: msg`60 days into the future based on each pattern's cadence. Useful for spotting which week is going to be heavy.`
            }
        ],
        publishedAt: '2026-02-22',
        updatedAt: '2026-05-03',
        ogTags: ['recurring', 'subscriptions', 'calendar']
    },
    {
        slug: 'transfer-pair-detection',
        tier: FeatureTierEnum.POWER,
        title: msg`Smart Transfer Consolidation`,
        tagline: msg`Two debits aren't a transfer. Budgie knows — IBAN-aware, cross-currency-aware, automatic.`,
        metaTitle: msg`Smart Transfer Consolidation — Budgie`,
        metaDescription: msg`When the same amount leaves account A and arrives at account B, Budgie merges them into one transfer. Counter-IBAN matching plus cross-currency tolerance.`,
        primaryKeyword: 'duplicate transaction merger',
        seoKeywords: [
            'duplicate transaction merger',
            'transfer pair detection',
            'auto-merge transfers',
            'IBAN match transfer',
            'cross-currency transfer detection'
        ],
        relatedFeatureSlugs: ['account-transfers', 'bank-resync-window', 'convert-to-transfer'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'mint-alternatives-developers'],
        faqs: [
            {
                question: msg`What if the algorithm misidentifies a transfer?`,
                answer: msg`Manual override is one tap. Tap the auto-merged transaction, choose "Split back into two", and it reverts to two separate entries with their original categories.`
            },
            {
                question: msg`Does this work across two different banks?`,
                answer: msg`Yes — that's the whole point. As long as both banks store the counter-IBAN on their side, Budgie can match them. Monobank, PrivatBank, and Erste all do.`
            },
            {
                question: msg`What about cross-currency transfers?`,
                answer: msg`Pairs match if the FX rate is plausible within a 3-day window. The original amounts in both currencies are preserved.`
            },
            {
                question: msg`Will old (already-imported) transactions get re-matched?`,
                answer: msg`Yes. Each new sync rescans recent entries against existing ones, so old debits-and-credits that didn't have counter-IBAN can still match retroactively when the matching info arrives.`
            }
        ],
        publishedAt: '2026-05-01',
        updatedAt: '2026-05-03',
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
        faqs: [
            {
                question: msg`How many splits can I make per transaction?`,
                answer: msg`No limit. Add as many split rows as you need; the total must equal the original transaction amount.`
            },
            {
                question: msg`Can splits have different tags?`,
                answer: msg`Yes. Each split row keeps its own tags and comment, fully independent of the others.`
            },
            {
                question: msg`Does split mode work for income too?`,
                answer: msg`Yes. Switch to split inside the income form just like the expense form.`
            },
            {
                question: msg`What happens to analytics after splitting?`,
                answer: msg`Each split row counts toward its own category in analytics — the parent transaction itself becomes invisible to category sums (it's just the wrapper).`
            }
        ],
        publishedAt: '2026-02-01',
        updatedAt: '2026-05-03',
        ogTags: ['split', 'categories', 'transactions']
    },
    {
        slug: 'ai-merchant-translation',
        tier: FeatureTierEnum.POWER,
        title: msg`AI Merchant Name Translation`,
        tagline: msg`Cyrillic, Greek, Arabic merchant strings — the on-device LLM transliterates and adds search keywords.`,
        metaTitle: msg`AI Merchant Translation — Budgie`,
        metaDescription: msg`Travel statements full of "АТБ" or "Καρρέ"? The on-device LLM normalizes non-Latin merchant names and adds searchable English keywords.`,
        primaryKeyword: 'multilingual expense tracker',
        seoKeywords: [
            'multilingual expense tracker',
            'merchant name translation',
            'cyrillic budget app',
            'transliterate transactions',
            'multi-script expense app'
        ],
        relatedFeatureSlugs: ['spending-analytics', 'voice-transaction-entry', 'multi-language-app'],
        relatedArticleSlugs: ['budgie-offline-financial-data', 'offline-first-privacy-financial-app'],
        faqs: [
            {
                question: msg`Which scripts are supported?`,
                answer: msg`Cyrillic (Ukrainian, Russian, Bulgarian, Serbian), Greek, Arabic, Hebrew, CJK (Chinese / Japanese / Korean), Thai, and more — any script the on-device LLM understands.`
            },
            {
                question: msg`Are the original merchant strings kept?`,
                answer: msg`Yes. The original is preserved for receipt-matching and audit; the translated form is what your search queries hit.`
            },
            {
                question: msg`What if the LLM mistranslates?`,
                answer: msg`Tap edit on any transaction and override the translated name manually. Your override is permanent for that merchant.`
            },
            {
                question: msg`Does this run on every transaction?`,
                answer: msg`Only when needed. Latin-script merchants skip translation. Non-Latin strings flow through the queue automatically after sync or manual entry.`
            }
        ],
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
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            {
                question: msg`How often do FX rates refresh?`,
                answer: msg`Daily, in the background. Each day gets its own snapshot stored on-device for accurate historical conversion.`
            },
            {
                question: msg`Where do the rates come from?`,
                answer: msg`A public-domain FX feed. No vendor account, no rate broker; the rate per day is auditable on your device.`
            },
            {
                question: msg`Can I see the original currency?`,
                answer: msg`Always. Tap any aggregated number to drill into the per-leg native amounts.`
            },
            {
                question: msg`What happens during a cross-currency transfer?`,
                answer: msg`Both legs are preserved (e.g. $1000 → €925) along with the FX rate at transfer time. See Account Transfers for details.`
            }
        ],
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
        faqs: [
            {
                question: msg`What's the difference between "I owe" and "owes me"?`,
                answer: msg`Direction. "I owe" is a liability — your net worth subtracts it. "Owes me" is a receivable — your net worth adds it. Same account type, opposite sign.`
            },
            {
                question: msg`Can I link a debt to a contact?`,
                answer: msg`Yes — each debt account has an optional contact name. Useful for tracking inter-personal loans without spreadsheets.`
            },
            {
                question: msg`How do I settle a debt?`,
                answer: msg`Make a transfer between the debt account and a real cash/bank account. The debt balance hits zero; archive the account if you want it off the home screen.`
            },
            {
                question: msg`Does the target return date trigger a reminder?`,
                answer: msg`Currently it's informational — surfaced in the account detail and recurring view. Push reminders are on the roadmap.`
            }
        ],
        publishedAt: '2025-12-29',
        updatedAt: '2026-05-03',
        ogTags: ['debt', 'loans', 'contacts']
    },
    {
        slug: 'bank-resync-window',
        tier: FeatureTierEnum.POWER,
        title: msg`Windowed Bank Re-sync`,
        tagline: msg`Re-pull a slice. Keep your edits. No nuke-from-orbit.`,
        metaTitle: msg`Windowed Bank Re-sync — Budgie`,
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
        faqs: [
            {
                question: msg`Why not just full re-sync?`,
                answer: msg`A full re-sync wipes your manual category overrides and edits. Windowed re-sync diffs only the slice you ask for, so old edits stay safe.`
            },
            {
                question: msg`What's the smallest window?`,
                answer: msg`Last 7 days. Larger windows (30, 90, custom) are also one-tap presets. Custom range opens a date picker.`
            },
            {
                question: msg`What happens to edited transactions in the window?`,
                answer: msg`A conflict picker appears for every edited row before write. You choose to keep your edit, take the bank's version, or merge fields.`
            },
            {
                question: msg`Can I re-sync transactions from before bank-sync was enabled?`,
                answer: msg`Only as far back as the bank's API supports. Monobank has months of history; PrivatBank XLSX is per-export. CSV import is the universal fallback.`
            }
        ],
        publishedAt: '2026-05-02',
        updatedAt: '2026-05-03',
        ogTags: ['bank sync', 're-sync', 'edits']
    },
    {
        slug: 'mcc-auto-category',
        tier: FeatureTierEnum.POWER,
        title: msg`MCC Auto-Categorization`,
        tagline: msg`Bank-issued codes do the work — coffee shops land in Food & Drink, gas stations in Transport.`,
        metaTitle: msg`MCC Auto-Categorization — Budgie`,
        metaDescription: msg`Bank-synced transactions carry Merchant Category Codes; Budgie maps them to your category tree automatically. Per-MCC overrides for personal preferences.`,
        primaryKeyword: 'automatic transaction categories',
        seoKeywords: [
            'automatic transaction categories',
            'MCC auto category',
            'merchant category code app',
            'MCC mapping budget app',
            'bank-issued category codes'
        ],
        relatedFeatureSlugs: ['ai-auto-categorization', 'privatbank-import', 'erste-bank-pdf-import', 'date-filter-presets'],
        relatedArticleSlugs: ['mint-alternatives-developers', 'ynab-alternatives-privacy'],
        faqs: [
            {
                question: msg`What's an MCC?`,
                answer: msg`Merchant Category Code — the universal 4-digit code your bank attaches to every card transaction. 5814 is "fast food", 4111 is "transit", 5411 is "supermarket", and so on.`
            },
            {
                question: msg`What if I want my own category mapping?`,
                answer: msg`Override per-MCC: point all 4111 (transit) into your "Commute" instead of the default "Travel". Override once, applies forever.`
            },
            {
                question: msg`What if the transaction has no MCC?`,
                answer: msg`Manual entries don't have MCC; some bank-sync flows drop it. AI category suggestions handle those — see On-Device AI Auto-Categorization.`
            },
            {
                question: msg`Can I see the MCC on a transaction?`,
                answer: msg`Yes — the MCC short and full description appear in the transaction edit form for any bank-synced row.`
            }
        ],
        publishedAt: '2026-01-02',
        updatedAt: '2026-05-03',
        ogTags: ['mcc', 'categorization', 'bank sync']
    },
    {
        slug: 'tag-analytics',
        tier: FeatureTierEnum.POWER,
        title: msg`Tag-Based Spending Analytics`,
        tagline: msg`#vacation, #shared, #reimbursable — quantified, with an "Untagged" bucket for completeness.`,
        metaTitle: msg`Tag-Based Analytics — Budgie`,
        metaDescription: msg`Slice spending and income by tag. Per-tag totals plus an "Untagged" bucket for the gaps. Drill from a tag into its transactions.`,
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
        faqs: [
            {
                question: msg`How is this different from category analytics?`,
                answer: msg`Categories answer "what kind of expense"; tags answer "for what purpose". Use both — categories give a structured view, tags give project / person / context views.`
            },
            {
                question: msg`What's in the "Untagged" bucket?`,
                answer: msg`Every transaction without any tags. The bucket is a deliberate gap-finder so you can spot which transactions need tagging.`
            },
            {
                question: msg`Can I see income totals per tag?`,
                answer: msg`Yes. Each tag row shows separate income, expense, and net totals — useful when a tag spans both (refunds tagged #vacation, for example).`
            },
            {
                question: msg`Can I drill into a tag's transactions?`,
                answer: msg`Tap any tag row to see every transaction in it for the current period.`
            }
        ],
        publishedAt: '2026-01-04',
        updatedAt: '2026-05-03',
        ogTags: ['tags', 'analytics', 'drill-down']
    },
    {
        slug: 'convert-to-transfer',
        tier: FeatureTierEnum.POWER,
        title: msg`Convert a Transaction to a Transfer`,
        tagline: msg`Reclassify, don't re-enter — turn an expense into a transfer in one tap.`,
        metaTitle: msg`Convert to Transfer — Budgie`,
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
        faqs: [
            {
                question: msg`What does "Convert to Transfer" actually do?`,
                answer: msg`The expense (or income) becomes the source leg of a transfer; you pick the destination account, and Budgie creates the destination leg automatically. Both legs are linked.`
            },
            {
                question: msg`Will my analytics update?`,
                answer: msg`Yes — the original spending stat falls out immediately because transfers don't count as expenses.`
            },
            {
                question: msg`Can I undo the conversion?`,
                answer: msg`Yes. Long-press the transfer and choose "Split back into two transactions"; both halves return to their original types.`
            },
            {
                question: msg`Does this work for cross-currency?`,
                answer: msg`Yes. The dual-amount input opens after picking the destination account. Original amount is preserved on the source leg; destination leg gets your specified amount.`
            }
        ],
        publishedAt: '2026-01-05',
        updatedAt: '2026-05-03',
        ogTags: ['transfer', 'convert', 'reclassify']
    },
    {
        slug: 'screenshot-protection',
        tier: FeatureTierEnum.NICHE,
        title: msg`Screenshot Protection`,
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
        faqs: [
            {
                question: msg`What does screenshot protection actually do?`,
                answer: msg`On Android, FLAG_SECURE prevents the OS from capturing screenshots. On iOS, sensitive views render a blur overlay in the app-switcher preview when Budgie goes to background.`
            },
            {
                question: msg`Can I disable it for receipts I want to share?`,
                answer: msg`Yes — Settings → Privacy → Screenshot protection. Toggle individual screens. The transaction-list screen and home screen are the typical "always on" candidates.`
            },
            {
                question: msg`Does it survive screen-recording apps?`,
                answer: msg`On Android, FLAG_SECURE blocks screen recording too. On iOS, the OS-level recording bypasses app-switcher blur, so this is more of a "passersby" defense than a "rootkit" defense.`
            },
            {
                question: msg`Will Face ID still work with the blur on?`,
                answer: msg`Yes. The blur applies to the app-switcher preview, not the foreground rendering. Face ID continues to work normally.`
            }
        ],
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
        faqs: [
            {
                question: msg`Which assets can I track?`,
                answer: msg`Crypto (Bitcoin, Ethereum, others), stocks (any ticker), ETFs, and commodities. Each holding is a row of (instrument, quantity, price).`
            },
            {
                question: msg`Where do prices come from?`,
                answer: msg`Manual update or imported brokerage CSV. Live ticker feeds are opt-in to keep the offline-first guarantee — no telemetry needed.`
            },
            {
                question: msg`How is this different from a portfolio tracker?`,
                answer: msg`Budgie integrates investment holdings into the same net-worth view as your bank accounts and debt. Most portfolio trackers don't model fiat side-by-side.`
            },
            {
                question: msg`Can I record buy / sell history?`,
                answer: msg`Yes — buys are inflows to the holding account; sells are outflows with the realized FX. P&L drilling on the way for a future release.`
            }
        ],
        publishedAt: '2025-11-17',
        updatedAt: '2026-05-03',
        ogTags: ['crypto', 'stocks', 'etf']
    },
    {
        slug: 'dark-mode',
        tier: FeatureTierEnum.NICHE,
        title: msg`True Dark Mode (Not Just Dimmed)`,
        tagline: msg`OLED-friendly black, locale-aware, no white flash on cold launch.`,
        metaTitle: msg`Dark Mode — Budgie`,
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
        faqs: [
            {
                question: msg`Is it true black or just dark gray?`,
                answer: msg`OLED-friendly black for the background. Cards and surfaces are dark gray for hierarchy, but the canvas pixels are off — saves battery on OLED screens.`
            },
            {
                question: msg`Does it switch automatically?`,
                answer: msg`Yes — system theme by default. Override to Light or Dark in Settings if you prefer.`
            },
            {
                question: msg`Why no white flash on cold launch?`,
                answer: msg`The native splash screen reads the OS theme directly so the transition into the React Native app stays in dark mode without an intermediate light state.`
            },
            {
                question: msg`Do charts recolor?`,
                answer: msg`Yes. Chart palettes recompute for legibility — emerald accents shift slightly for contrast on a dark canvas.`
            }
        ],
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
        faqs: [
            {
                question: msg`Which languages are supported?`,
                answer: msg`English (source), Ukrainian, French, German, Spanish. More on the roadmap as the community contributes translations.`
            },
            {
                question: msg`How does language detection work?`,
                answer: msg`Auto-detected from device locale on first launch. Override anytime in Settings → Language.`
            },
            {
                question: msg`Does it require a relaunch?`,
                answer: msg`No. Switching language re-renders the UI in-place, no reinstall or relaunch.`
            },
            {
                question: msg`What about number / date formats?`,
                answer: msg`Numbers, dates, and currency formats follow the device locale even when the UI language differs. Set them independently in Settings if you prefer.`
            }
        ],
        publishedAt: '2025-11-17',
        updatedAt: '2026-05-03',
        ogTags: ['i18n', 'languages', 'multilingual']
    },
    {
        slug: 'primary-tag',
        tier: FeatureTierEnum.NICHE,
        title: msg`Primary Tag — Scan Your Transactions At A Glance`,
        tagline: msg`One badge. Scan a long list at a glance.`,
        metaTitle: msg`Primary Tag — Budgie`,
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
        faqs: [
            {
                question: msg`What does "primary" actually do?`,
                answer: msg`Visual emphasis. The primary tag renders as a corner-star badge on the transaction list so you can scan a long list for #vacation or #shared without opening any row.`
            },
            {
                question: msg`How do I set a primary tag?`,
                answer: msg`Long-press a tag chip on the transaction card. The tap rotates which of that transaction's tags is primary.`
            },
            {
                question: msg`Is the primary tag preserved across edits?`,
                answer: msg`Yes. Editing a transaction keeps its primary-tag designation; bank-sync re-imports also preserve it.`
            },
            {
                question: msg`Can a transaction have no primary tag?`,
                answer: msg`Yes — by default, none is primary. The badge appears only when you explicitly promote one.`
            }
        ],
        publishedAt: '2026-04-24',
        updatedAt: '2026-05-03',
        ogTags: ['tags', 'ui', 'scanning']
    }
] as const;
/* eslint-enable lingui/no-unlocalized-strings */
