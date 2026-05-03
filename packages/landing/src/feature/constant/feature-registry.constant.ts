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
        metaDescription: msg`Budgie is a 100% offline-first expense tracker. Your financial data never leaves your phone — encrypted SQLite, no servers, no account required.`,
        primaryKeyword: 'offline expense tracker app',
        seoKeywords: [
            'offline expense tracker',
            'offline budget app',
            'private finance app',
            'no account budget app',
            'local-first expense tracker'
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
        seoKeywords: ['monobank sync', 'monobank api', 'monobank expense tracker', 'monobank transaction import', 'monobank budget app'],
        relatedFeatureSlugs: [
            'offline-first-expense-tracker',
            'transfer-pair-detection',
            'bank-resync-window',
            'mcc-auto-category',
            'csv-import'
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
        metaDescription: msg`Budgie's on-device 1.7B LLM and embedding model categorize new transactions privately. Your statements never touch a server. Vector search plus a generative pass.`,
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
            'ai-merchant-translation',
            'mcc-auto-category',
            'custom-categories'
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
        metaDescription: msg`Log expenses, income, and transfers in seconds with a quick-entry bottom sheet that picks the right account, category, and date by default. Edit, split, or convert from the list.`,
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
            'account-transfers'
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
        metaDescription: msg`Track unlimited bank accounts, cash wallets, savings, crypto, stocks, and debt — grouped, archived, and renamed however you want. Each account is a first-class entity with its own currency.`,
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
        relatedFeatureSlugs: ['tag-analytics', 'custom-categories', 'date-filter-presets', 'recurring-payments-calendar'],
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
        relatedFeatureSlugs: ['ai-auto-categorization', 'mcc-auto-category', 'expense-tracking', 'transaction-tags'],
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
        relatedFeatureSlugs: ['tag-analytics', 'primary-tag', 'custom-categories', 'expense-tracking'],
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
        relatedFeatureSlugs: ['transfer-pair-detection', 'convert-to-transfer', 'multi-currency', 'expense-tracking'],
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
        relatedFeatureSlugs: ['erste-bank-pdf-import', 'privatbank-import', 'monobank-sync', 'mcc-auto-category'],
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
        relatedFeatureSlugs: ['csv-import', 'privatbank-import', 'monobank-sync'],
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
        relatedFeatureSlugs: ['spending-analytics', 'recurring-payments-calendar', 'tag-analytics'],
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
    }
] as const;
/* eslint-enable lingui/no-unlocalized-strings */
