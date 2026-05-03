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
    },
    {
        slug: 'expense-tracking',
        tier: FeatureTierEnum.CORE,
        title: msg`Expense Tracking, Reimagined`,
        tagline: msg`Two taps from open to saved — a bottom-sheet quick-entry form designed for one-handed use.`,
        metaTitle: msg`Expense Tracking, Reimagined — Budgie`,
        metaDescription: msg`Log expenses, income, and transfers in seconds with a quick-entry bottom sheet that picks the right account, category, and date by default. Edit, split, or convert from the list.`,
        primaryKeyword: 'personal expense tracker',
        seoKeywords: ['personal expense tracker', 'expense tracking app', 'log expenses fast', 'mobile expense logger', 'expense tracker bottom sheet'],
        heroBenefits: [
            msg`Two-tap entry: smart defaults for account, category, and date pick the right values out of the box`,
            msg`Three first-class transaction types: expense, income, transfer — never confused, never miscounted`,
            msg`Long-press any row for context actions: edit, delete, split, convert to transfer`,
            msg`MCC pre-fill on bank-synced transactions; AI category suggestion on manual entries`,
            msg`Comments grow vertically up to two lines so receipts and references fit without truncation`
        ],
        relatedFeatureSlugs: ['voice-transaction-entry', 'custom-categories', 'transaction-tags', 'split-transactions', 'account-transfers'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            { question: msg`How fast is the quick-entry form?`, answer: msg`Open the sheet, type the amount, tap save — that's the typical flow once defaults are tuned to your habits. The form picks your default account, the most-likely category, and today's date automatically.` },
            { question: msg`Can I edit a transaction after saving?`, answer: msg`Always. Long-press the row in the list for a context menu with Edit, Delete, Split, and Convert to Transfer actions.` },
            { question: msg`Does Budgie distinguish transfers from expenses?`, answer: msg`Yes. Transfer is a first-class transaction type with explicit source and destination accounts; it never inflates your spending stats.` },
            { question: msg`What about recurring purchases?`, answer: msg`Budgie auto-detects recurring patterns and surfaces them on a dedicated calendar tab. See the Recurring Payments Calendar feature for details.` }
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
        seoKeywords: ['money management app', 'multi-account budget app', 'unlimited accounts tracker', 'crypto and bank tracker', 'mobile money manager'],
        heroBenefits: [
            msg`Unlimited accounts: Bank, Cash, Crypto, Stocks, Debt — each with its own currency and balance`,
            msg`Bank-synced accounts auto-group by provider on the home screen`,
            msg`Liability and debt accounts support negative balances and a target return date`,
            msg`Archive without deleting — old accounts disappear from the home but stay searchable`,
            msg`"Include in net worth" toggle per account for partial-truth balance sheets`
        ],
        relatedFeatureSlugs: ['net-worth-tracker', 'multi-currency', 'debt-tracking', 'crypto-investment-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
        faqs: [
            { question: msg`Is there a limit on the number of accounts?`, answer: msg`No. Add as many as you need — the home screen organizes them by type and provider so the list stays scannable.` },
            { question: msg`Can I track an account in a different currency?`, answer: msg`Yes. Each account has a fixed currency. Daily exchange-rate snapshots convert everything to your base currency for net worth.` },
            { question: msg`What happens to transactions when I delete an account?`, answer: msg`Budgie prompts you to migrate them to another account or wipe them. Archiving is the safer alternative — it hides the account from the home but keeps the data.` },
            { question: msg`Can I track loans I owe or money owed to me?`, answer: msg`Yes. Debt is a dedicated account type with explicit "I owe" / "owes me" direction. See Debt & Loan Tracking for details.` }
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
        seoKeywords: ['spending tracker with charts', 'expense analytics app', 'category breakdown chart', 'tag analytics', 'mobile finance dashboard'],
        heroBenefits: [
            msg`Categories tab: per-category totals, with drill-down to every transaction in the slice`,
            msg`Tags tab: per-tag income and expense, plus an "Untagged" bucket for the gaps`,
            msg`Recurring tab: subscription cadence and forecasted upcoming bills`,
            msg`Eight date presets: Today through All Time, plus a custom range fallback`,
            msg`Compact tile mode shows weekly/monthly net flow alongside category totals`
        ],
        relatedFeatureSlugs: ['tag-analytics', 'custom-categories', 'date-filter-presets', 'recurring-payments-calendar'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            { question: msg`Can I drill down from a chart to the transactions?`, answer: msg`Yes. Tap any category or tag slice to see every transaction that contributed to it during the current period.` },
            { question: msg`What's an "Untagged" bucket?`, answer: msg`A deliberate gap-finder. Transactions without tags accumulate in this bucket so you can spot bookkeeping gaps and tighten them up.` },
            { question: msg`Can I compare months?`, answer: msg`Yes. Switch the date filter between presets like This Month, Last Month, This Year. Compact tile mode also shows period-over-period deltas.` },
            { question: msg`Are charts rendered offline?`, answer: msg`Yes. Analytics reads directly from your local SQLite database — every chart works without internet.` }
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
        seoKeywords: ['custom budget categories', 'custom expense categories', 'merge categories app', 'reassign transactions categories', 'budget category tree'],
        heroBenefits: [
            msg`Create unlimited categories with custom names, icons, and colors`,
            msg`Merge two categories into one with mass-reassignment of transactions`,
            msg`Selector reorders by your usage frequency — the categories you tap most surface first`,
            msg`MCC mapping pre-fills bank-synced transactions; AI suggestions cover manual ones`,
            msg`Safe deletion: prompts you to migrate or wipe transactions, never silently orphans`
        ],
        relatedFeatureSlugs: ['ai-auto-categorization', 'mcc-auto-category', 'expense-tracking', 'transaction-tags'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            { question: msg`Can I rename categories without losing data?`, answer: msg`Yes. Rename is non-destructive — every transaction in the category keeps its link via the category ID, not the name.` },
            { question: msg`What does merging two categories do?`, answer: msg`The merged-from category's transactions are reassigned to the merged-into category, and the empty category is deleted. Reversible only by re-categorizing manually.` },
            { question: msg`How does the popularity sort work?`, answer: msg`The selector tracks how often each category is picked and reorders the list so the top tappers stay near the top. The order is per-device.` },
            { question: msg`Can I import a pre-built category tree?`, answer: msg`Not directly, but CSV import with column mapping can populate categories on first import. After that, edit them like any other.` }
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
        seoKeywords: ['transaction labels app', 'expense tagging app', 'tag transactions', 'project expense tags', 'shared expense tracker'],
        heroBenefits: [
            msg`Tags are flat, reusable, and combine freely — no rigid hierarchy`,
            msg`One tag per transaction can be promoted to "primary" with a corner-star badge`,
            msg`Selector stays open across multi-selections; commit with a Done pill`,
            msg`Merge tags across the database — same mass-reassignment story as categories`,
            msg`Tag-based analytics: per-tag totals plus an "Untagged" bucket`
        ],
        relatedFeatureSlugs: ['tag-analytics', 'primary-tag', 'custom-categories', 'expense-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'mint-alternatives-developers'],
        faqs: [
            { question: msg`How are tags different from categories?`, answer: msg`Categories answer "what kind of expense"; tags answer "for which project, person, or purpose." Use both together — one transaction can be Groceries (category) AND #vacation #shared (tags).` },
            { question: msg`How many tags can I add to a transaction?`, answer: msg`No limit. Layer as many as you need; one of them can be promoted to "primary" for the at-a-glance badge on the transaction list.` },
            { question: msg`What does "primary tag" mean?`, answer: msg`The primary tag shows as a corner-star badge on the transaction list so you can scan a long list for #vacation or #shared without opening rows. Long-press to rotate which tag is primary.` },
            { question: msg`Can I rename or merge tags?`, answer: msg`Both. Same flow as categories — rename is non-destructive; merge mass-reassigns the transactions and removes the source tag.` }
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
        seoKeywords: ['transfer between accounts app', 'cross-currency transfer tracker', 'first-class transfers app', 'dual-amount transfer', 'FX transfer tracking'],
        heroBenefits: [
            msg`First-class Transfer transaction type — never confused with expense or income`,
            msg`Cross-currency dual-amount display: pin send or receive, system computes the other`,
            msg`Original FX rate stored per leg for exact balance reconciliation`,
            msg`Currency-mode pill switches whether you drive from send or receive direction`,
            msg`Convert any expense or income to a transfer retroactively — no re-entry needed`
        ],
        relatedFeatureSlugs: ['transfer-pair-detection', 'convert-to-transfer', 'multi-currency', 'expense-tracking'],
        relatedArticleSlugs: ['ynab-alternatives-privacy', 'budgie-offline-financial-data'],
        faqs: [
            { question: msg`Why is "transfer" a separate type?`, answer: msg`Money moved between your own accounts is not income or expense. Treating transfers as expenses double-counts your spending. Budgie's first-class Transfer type keeps your stats accurate.` },
            { question: msg`What about cross-currency transfers?`, answer: msg`Dual-amount input shows both legs (e.g. $1000 → €925). Pin either side; the FX rate is preserved per leg so reconciliation across currencies stays exact.` },
            { question: msg`Can I auto-link transfers from my bank?`, answer: msg`Yes — see Smart Transfer Consolidation. Bank-synced debits and credits matching by amount, time window, and counter-IBAN auto-merge into a single transfer.` },
            { question: msg`Can I undo a transfer?`, answer: msg`Long-press the transfer in the list and Edit or Delete. The corresponding leg in the destination account stays linked and updates with you.` }
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
        seoKeywords: ['import bank statement CSV', 'CSV bank import app', 'flexible CSV column mapping', 'CSV import preset', 'bank statement importer'],
        heroBenefits: [
            msg`Map columns flexibly: Date, Amount, Description, Counterparty — your bank's order, not ours`,
            msg`Save a per-bank preset and never re-map again`,
            msg`Decimal separator and date format options handle US, EU, and ISO variants`,
            msg`Re-import detects duplicates by externalId — safe to re-pull the same statement`,
            msg`Preview every row before write so you can spot mis-mappings instantly`
        ],
        relatedFeatureSlugs: ['erste-bank-pdf-import', 'privatbank-import', 'monobank-sync', 'mcc-auto-category'],
        relatedArticleSlugs: ['mint-alternatives-developers', 'budgie-offline-financial-data'],
        faqs: [
            { question: msg`Will it work with my bank?`, answer: msg`If your bank exports CSV, yes. The flexible column mapper accommodates any column order, separator, and date format — set up once, save as a preset.` },
            { question: msg`What happens if I import the same file twice?`, answer: msg`Budgie deduplicates by transaction ID. Existing rows are skipped; only new ones insert. Re-importing is safe.` },
            { question: msg`Does CSV import preserve the original transaction date?`, answer: msg`Yes. The mapper captures both booking date and value date when both are present in the CSV; transactions sort by your preference.` },
            { question: msg`Can I edit transactions after CSV import?`, answer: msg`Always. Imported transactions are normal Budgie transactions — edit, split, tag, or convert to transfer just like manual entries.` }
        ],
        publishedAt: '2025-12-21',
        updatedAt: '2026-05-03',
        ogTags: ['csv', 'import', 'bank statement']
    }
] as const;
/* eslint-enable lingui/no-unlocalized-strings */
