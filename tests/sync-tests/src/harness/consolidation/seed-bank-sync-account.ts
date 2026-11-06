import { AccountTypeEnum } from '@budgie/contracts';

import { seed } from '../seed/seed';

import type { ExternalSourceEnum } from '@budgie/contracts';

export const seedBankSyncAccount = (title: string, externalSource: ExternalSourceEnum | null, iban: string, instrumentId?: number) =>
    seed.account({
        title,
        type: AccountTypeEnum.BANK_SYNC,
        externalSource,
        iban,
        ...(instrumentId && { instrumentId })
    });
