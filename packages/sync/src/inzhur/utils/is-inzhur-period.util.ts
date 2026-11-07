import type { InzhurPairingPeriodInterface } from '../interface/inzhur-pairing-period.interface';
import type { TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export const isInzhurPeriod = (transaction: TransactionWithEntriesEntityInterface, period: InzhurPairingPeriodInterface) =>
    transaction.operatedAt >= period.from && transaction.operatedAt < period.until;
