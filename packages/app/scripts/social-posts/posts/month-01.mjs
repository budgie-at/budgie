import {
    checklistSlide,
    chipsSlide,
    comparisonSlide,
    flowSlide,
    iconListSlide,
    pollSlide,
    repoSlide,
    statementSlide
} from '../slide-layouts.mjs';

const BUDGIE_BACKUP_CAVEAT = 'No automatic cloud backup in Budgie. Export your database file or CSV before you lose a device.';

const CARD_SIZES = ['master'];
const EDITORIAL_SIZES = ['editorial', 'master'];
const VIDEO_SIZES = ['story', 'master'];
const THUMBNAIL_SIZES = ['square'];

const VIDEO_POSTS = [
    {
        post: 'd01',
        slug: 'launch',
        hook: 'Meet the money app that can’t see your money.',
        end: 'Budgie keeps financial clarity on your device.',
        screen: 'home',
        thumbnail: true
    },
    {
        post: 'd04',
        slug: 'airplane-mode',
        hook: 'The airplane-mode test.',
        end: 'Some things still need the internet: bank sync, initial downloads, and fresh rates.',
        endLevel: 'md',
        screen: 'accounts'
    },
    {
        post: 'd06',
        slug: 'onboarding',
        hook: 'No account. No email. No sign-up.',
        end: 'Start tracking without handing over your financial life.',
        screen: 'onboarding'
    },
    {
        post: 'd08',
        slug: 'local-ai',
        hook: 'AI that stays on the phone.',
        end: 'AI help can happen without sending your finance history to a cloud model.',
        endLevel: 'md',
        screen: 'ai-suggestion'
    },
    {
        post: 'd09',
        slug: 'screen-privacy',
        hook: 'Privacy when someone else sees your screen.',
        end: 'Privacy should cover the moments around the app, too.',
        screen: 'lock'
    },
    {
        post: 'd11',
        slug: 'voice-entry',
        hook: 'Speak an expense. Budgie logs it.',
        end: 'Less typing, still private by design.',
        screen: 'voice-entry'
    },
    {
        post: 'd14',
        slug: 'whole-picture',
        hook: 'One view of the whole picture.',
        end: 'One view of your money, built around your data ownership.',
        screen: 'accounts'
    },
    {
        post: 'd20',
        slug: 'product-tour',
        hook: 'Thirty seconds of Budgie.',
        end: 'Private expense tracking on your device.',
        screen: 'home',
        thumbnail: true
    }
];

function videoPost(definition) {
    const { post, slug, hook, end, endLevel = 'lg', screen, thumbnail = false } = definition;
    const slides = [
        {
            sizes: VIDEO_SIZES,
            screens: [],
            alt: `Video hook card reading “${hook}” on a dark Budgie canvas.`,
            render: context => statementSlide({ text: hook, level: 'xl' }, context)
        },
        {
            sizes: VIDEO_SIZES,
            screens: [screen],
            alt: `Video end card reading “${end}” above a framed Budgie ${screen} screen.`,
            render: context => statementSlide({ text: end, level: endLevel, screen }, context)
        }
    ];

    if (thumbnail) {
        slides.push({
            sizes: THUMBNAIL_SIZES,
            screens: [screen],
            alt: `Square thumbnail reading “${hook}” beside a framed Budgie ${screen} screen.`,
            render: context => statementSlide({ text: hook, level: 'md', screen, place: 'side' }, context)
        });
    }

    return { post, slug, slides };
}

const CAROUSEL_POSTS = [
    {
        post: 'd02',
        slug: 'no-account-question',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: ['onboarding'],
                alt: 'Slide asking why a finance app needs your email, with a framed Budgie onboarding screen below the text.',
                render: context =>
                    statementSlide(
                        {
                            text: 'Why does a finance app need your email?',
                            level: 'lg',
                            secondary: 'Sometimes the best account is no account at all.',
                            screen: 'onboarding'
                        },
                        context
                    )
            }
        ]
    },
    {
        post: 'd03',
        carousel: true,
        slug: 'data-location',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Opening slide asking where your finance data lives.',
                render: context => statementSlide({ text: 'Where does your finance data live?', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Diagram of a person, an app and a vendor cloud, illustrating that many apps send data to a vendor cloud.',
                render: context =>
                    flowSlide(
                        {
                            text: 'Many apps send data to a vendor cloud.',
                            nodes: [
                                { label: 'You', iconName: 'user' },
                                { label: 'The app', iconName: 'phone' },
                                { label: 'Vendor cloud', iconName: 'cloud' }
                            ]
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Diagram of a person pointing to their own device, whose local database is encrypted once a PIN is set, illustrating a local-first model.',
                render: context =>
                    flowSlide(
                        {
                            text: 'Budgie is built around a local-first model.',
                            nodes: [
                                { label: 'You', iconName: 'user' },
                                {
                                    label: 'Your device',
                                    note: 'Local database · encrypted once you set a PIN',
                                    iconName: 'phone',
                                    variant: 'accent'
                                }
                            ]
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Slide noting that local-first still needs clear backups and honest limits, with caveat chips for bank sync, model downloads and exchange-rate refresh.',
                render: context =>
                    chipsSlide(
                        {
                            text: 'Local-first still needs clear backups and honest limits.',
                            tags: ['Bank sync', 'Model downloads', 'Exchange-rate refresh']
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Checklist telling readers to ask where data is stored, processed, backed up and exported before choosing an app.',
                render: context =>
                    checklistSlide(
                        {
                            lead: 'Before choosing an app, ask where the data is:',
                            level: 'sm',
                            items: ['stored', 'processed', 'backed up', 'exported']
                        },
                        context
                    )
            }
        ]
    },
    {
        post: 'd05',
        slug: 'privacy-poll',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Poll card asking what is non-negotiable for your money data, with four options: no account wall, local storage, export control and no ad profiling.',
                render: context =>
                    pollSlide(
                        {
                            text: 'What is non-negotiable for your money data?',
                            items: [
                                { label: 'No account wall', iconName: 'userX' },
                                { label: 'Local storage', iconName: 'phone' },
                                { label: 'Export control', iconName: 'download' },
                                { label: 'No ad profiling', iconName: 'eyeOff' }
                            ]
                        },
                        context
                    )
            }
        ]
    },
    {
        post: 'd10',
        carousel: true,
        slug: 'backup-tradeoff',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Opening slide reading that local-first is not magic backup.',
                render: context => statementSlide({ text: 'Local-first is not magic backup.', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Slide reading that your finance history can stay under your control.',
                render: context => statementSlide({ text: 'Your finance history can stay under your control.', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Slide reading that you still need a deliberate backup plan.',
                render: context => statementSlide({ text: 'You still need a deliberate backup plan.', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Four-row checklist covering what is stored locally, what syncs, what exports and what happens if a device is lost.',
                render: context =>
                    checklistSlide(
                        {
                            lead: 'Know:',
                            level: 'xl',
                            items: ['what is stored locally', 'what syncs', 'what exports', 'what happens if a device is lost']
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: `Closing slide reading “${BUDGIE_BACKUP_CAVEAT}”`,
                render: context => statementSlide({ text: BUDGIE_BACKUP_CAVEAT, level: 'md' }, context)
            }
        ]
    },
    {
        post: 'd13',
        carousel: true,
        slug: 'import-paths',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Opening slide reading that import should not mean surrendering your finance account.',
                render: context =>
                    statementSlide({ text: 'Import should not mean surrendering your finance account.', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Aggregator model diagram: your bank, then an aggregator cloud, then the app.',
                render: context =>
                    flowSlide(
                        {
                            text: 'Aggregator model',
                            level: 'xl',
                            nodes: [
                                { label: 'Your bank', iconName: 'bank' },
                                { label: 'Aggregator cloud', iconName: 'cloud' },
                                { label: 'The app', iconName: 'phone' }
                            ]
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: ['bank-sync'],
                alt: 'Direct sync diagram: your bank to your device with no aggregator in between, with Monobank and Binance chips beside a framed Budgie bank sync screen.',
                render: context =>
                    flowSlide(
                        {
                            text: 'Direct sync',
                            level: 'xl',
                            nodes: [
                                { label: 'Your bank', iconName: 'bank' },
                                { label: 'Your device', iconName: 'phone', variant: 'accent' }
                            ],
                            tags: ['Monobank', 'Binance'],
                            note: 'Network required · no aggregator in between',
                            screen: 'bank-sync'
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: ['import'],
                alt: 'Statement import diagram: a statement file to your device, labelled works offline, with CSV, PrivatBank XLSX and Erste PDF chips beside a framed Budgie import screen.',
                render: context =>
                    flowSlide(
                        {
                            text: 'Statement import',
                            level: 'xl',
                            nodes: [
                                { label: 'Statement file', iconName: 'file' },
                                { label: 'Your device', iconName: 'phone', variant: 'accent' }
                            ],
                            tags: ['CSV', 'PrivatBank XLSX', 'Erste PDF'],
                            note: 'Works offline',
                            noteIcon: 'check',
                            screen: 'import'
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Checklist telling readers to ask who receives the data, where it is processed and what works offline.',
                render: context =>
                    checklistSlide(
                        {
                            lead: 'Ask:',
                            level: 'xl',
                            items: ['who receives the data', 'where it is processed', 'what works offline']
                        },
                        context
                    )
            }
        ]
    },
    {
        post: 'd15',
        carousel: true,
        slug: 'weekly-review',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Opening slide reading a five-minute money review.',
                render: context => statementSlide({ text: 'A five-minute money review.', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Slide asking what changed this week.',
                render: context => statementSlide({ text: 'What changed this week?', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Slide asking what surprised me.',
                render: context => statementSlide({ text: 'What surprised me?', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Slide asking what needs attention next week.',
                render: context => statementSlide({ text: 'What needs attention next week?', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: ['analytics'],
                alt: 'Closing slide inviting readers to use any tracker they trust, above a framed Budgie analytics screen.',
                render: context =>
                    statementSlide(
                        {
                            text: 'Use any tracker you trust. Budgie keeps the review private and local-first.',
                            level: 'md',
                            screen: 'analytics'
                        },
                        context
                    )
            }
        ]
    },
    {
        post: 'd16',
        slug: 'source-transparency',
        slides: [
            {
                sizes: EDITORIAL_SIZES,
                screens: ['settings-security'],
                alt: 'Editorial slide reading that privacy claims should be inspectable, with a repository file list and a framed Budgie security settings screen.',
                render: context =>
                    repoSlide(
                        {
                            text: 'Privacy claims should be inspectable.',
                            repository: 'github.com/budgie-at/budgie',
                            files: [
                                'packages/app/app.config.js',
                                'packages/app/src/export/service/database-export.service.ts',
                                'packages/app/src/@generic/component/screenshot-protection-controller/screenshot-protection-controller.tsx',
                                'LICENSE'
                            ],
                            annotation: 'SQLCipher flag, database export, screenshot protection, license — all inspectable.',
                            screen: 'settings-security',
                            note: 'Source is public. Check the code.'
                        },
                        context
                    )
            }
        ]
    },
    {
        post: 'd17',
        slug: 'data-promises',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Slide listing five lines Budgie will not cross, with a line icon on each row.',
                render: context =>
                    iconListSlide(
                        {
                            text: 'Five lines Budgie will not cross.',
                            items: [
                                { label: 'No ad profiling from finance data', iconName: 'eyeOff' },
                                { label: 'No mandatory account wall', iconName: 'userX' },
                                { label: 'No sale of personal finance history', iconName: 'tag' },
                                { label: 'No cloud upload of local history without clear user action', iconName: 'cloudOff' },
                                { label: 'No fake privacy theater', iconName: 'shield' }
                            ]
                        },
                        context
                    )
            }
        ]
    },
    {
        post: 'd18',
        carousel: true,
        slug: 'comparison',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Opening slide comparing local-first and cloud-first finance tracking.',
                render: context => statementSlide({ text: 'Local-first vs cloud-first finance tracking.', level: 'xl' }, context)
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Data location comparison: on your device for local-first Budgie, on the vendor servers for a cloud-first tracker.',
                render: context =>
                    comparisonSlide(
                        {
                            label: 'Data location',
                            mine: 'On your device',
                            theirs: 'On the vendor’s servers',
                            mineIcon: 'phone',
                            theirsIcon: 'server'
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Offline use comparison: full history, add expenses and insights for local-first Budgie, often limited to cached views for a cloud-first tracker.',
                render: context =>
                    comparisonSlide(
                        {
                            label: 'Offline use',
                            mine: 'Full history, add expenses, insights',
                            theirs: 'Often limited to cached views',
                            mineIcon: 'wifiOff',
                            theirsIcon: 'cloud',
                            note: 'Bank sync and rate refresh still use the network.'
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'AI processing comparison: on-device model with a one-time download for local-first Budgie, a cloud model that sees your data for a cloud-first tracker.',
                render: context =>
                    comparisonSlide(
                        {
                            label: 'AI processing',
                            mine: 'On-device model, one-time download',
                            theirs: 'Cloud model sees your data',
                            mineIcon: 'cpu',
                            theirsIcon: 'cloud'
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Account requirement comparison: none for local-first Budgie, email or login usually required for a cloud-first tracker.',
                render: context =>
                    comparisonSlide(
                        {
                            label: 'Account requirement',
                            mine: 'None',
                            theirs: 'Email or login usually required',
                            mineIcon: 'userX',
                            theirsIcon: 'mail'
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Transparency comparison: public source code for local-first Budgie, usually closed source for a cloud-first tracker.',
                render: context =>
                    comparisonSlide(
                        {
                            label: 'Transparency',
                            mine: 'Public source code',
                            theirs: 'Usually closed source',
                            mineIcon: 'code',
                            theirsIcon: 'lock'
                        },
                        context
                    )
            },
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Closing slide inviting readers to choose the trade-offs they actually want.',
                render: context => statementSlide({ text: 'Choose the trade-offs you actually want.', level: 'xl' }, context)
            }
        ]
    },
    {
        post: 'd19',
        slug: 'selection-checklist',
        slides: [
            {
                sizes: CARD_SIZES,
                screens: [],
                alt: 'Checklist of five questions to ask before trusting a finance app, with empty checkboxes.',
                render: context =>
                    checklistSlide(
                        {
                            lead: 'Before trusting a finance app, ask these five questions.',
                            level: 'md',
                            hollow: true,
                            items: [
                                'Where is my data stored?',
                                'Is an account required?',
                                'Who processes AI features?',
                                'Can I export or back up my data?',
                                'Which third-party SDKs are involved?'
                            ],
                            note: 'Useful even if you do not choose Budgie.'
                        },
                        context
                    )
            }
        ]
    }
];

export function monthOnePosts() {
    return [...CAROUSEL_POSTS, ...VIDEO_POSTS.map(videoPost)].sort((left, right) => left.post.localeCompare(right.post));
}
