import { ExternalSourceEnum } from '@budgie/contracts';

export const INZHUR_BANK_DESCRIPTION_PATTERNS = {
    counterparties: ['інжур кепітал', 'інжур', 'инжур', 'inzhur capital', 'inzhur'],
    dividendKeywords: ['дивіденд', 'дивиденд', 'dividend', 'виплата доходу'],
    externalSources: [ExternalSourceEnum.MONOBANK, ExternalSourceEnum.PRIVATBANK]
} as const;
