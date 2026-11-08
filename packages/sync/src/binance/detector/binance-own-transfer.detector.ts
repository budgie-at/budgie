import { ExternalSourceEnum, InstrumentTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import type { TransactionEntityInterface } from '@budgie/contracts';

class BinanceOwnTransferDetector {
    readonly titlePrefix = 'Binance ';

    matches(transaction: Pick<TransactionEntityInterface, 'externalSource' | 'title'>): boolean {
        return (
            transaction.externalSource === ExternalSourceEnum.BINANCE &&
            transaction.title.startsWith(this.titlePrefix) &&
            /^\S+ (?:deposit|withdrawal)$/u.test(transaction.title.slice(this.titlePrefix.length))
        );
    }

    allowsFallback(
        transaction: Pick<TransactionEntityInterface, 'externalSource' | 'title' | 'type'>,
        instrumentType: InstrumentTypeEnum | undefined
    ): boolean {
        return (
            transaction.externalSource !== ExternalSourceEnum.BINANCE ||
            (this.matches(transaction) && transaction.type === TransactionTypeEnum.INCOME && instrumentType === InstrumentTypeEnum.FIAT)
        );
    }
}

export const binanceOwnTransferDetector = new BinanceOwnTransferDetector();
