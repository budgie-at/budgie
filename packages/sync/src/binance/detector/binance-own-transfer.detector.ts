import { ExternalSourceEnum, InstrumentTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import type { TransactionEntityInterface } from '@budgie/contracts';

class BinanceOwnTransferDetector {
    matches(transaction: Pick<TransactionEntityInterface, 'externalSource' | 'title'>): boolean {
        return transaction.externalSource === ExternalSourceEnum.BINANCE && /^Binance \S+ (deposit|withdrawal)$/u.test(transaction.title);
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
