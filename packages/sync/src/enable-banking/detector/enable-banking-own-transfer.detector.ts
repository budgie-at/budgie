import { ExternalSourceEnum } from '@budgie/contracts';

import type { TransactionEntityInterface } from '@budgie/contracts';

class EnableBankingOwnTransferDetector {
    readonly bookingHorizonMs = 7 * 24 * 60 * 60 * 1000;

    pairsAcrossDays(
        left: Pick<TransactionEntityInterface, 'externalSource' | 'operatedAt'>,
        right: Pick<TransactionEntityInterface, 'externalSource' | 'operatedAt'>
    ): boolean {
        return (
            [left.externalSource, right.externalSource].includes(ExternalSourceEnum.ENABLE_BANKING) &&
            Math.abs(left.operatedAt.getTime() - right.operatedAt.getTime()) <= this.bookingHorizonMs
        );
    }
}

export const enableBankingOwnTransferDetector = new EnableBankingOwnTransferDetector();
