import { ExternalSourceEnum } from '@budgie/contracts';

export const INZHUR_BANK_DESCRIPTION_PATTERNS = {
    counterparties: ['тов інжур кепітал', 'інжур кепітал', 'тов інжур', 'inzhur capital', 'inzhur kepital'],
    companyIbans: ['UA553071230000026504020119504'],
    withdrawalPhrases: ['повернення коштів з брокерського рахунку'],
    dividendKeywords: ['дивіденд', 'дивиденд', 'dividend', 'виплата доходу'],
    externalSources: [ExternalSourceEnum.MONOBANK, ExternalSourceEnum.PRIVATBANK]
} as const;
