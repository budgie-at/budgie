import { ExternalSourceEnum } from '@budgie/contracts';

export const INZHUR_BANK_DESCRIPTION_PATTERNS = {
    counterparties: ['інжур кепітал', 'інжур', 'инжур', 'inzhur capital', 'inzhur'],
    dividendKeywords: ['дивіденд', 'дивиденд', 'dividend', 'виплата доходу'],
    peerTransferMcc: '4829',
    externalSources: [ExternalSourceEnum.MONOBANK, ExternalSourceEnum.PRIVATBANK]
} as const;
