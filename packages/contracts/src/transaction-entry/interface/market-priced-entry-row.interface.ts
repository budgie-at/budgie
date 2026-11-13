import type { TransactionEntityInterface } from '../../transaction/entity/transaction-entity.interface';
import type { TransactionEntryEntityInterface } from '../entity/transaction-entry-entity.interface';

export type MarketPricedEntryRowInterface = Pick<
    TransactionEntryEntityInterface,
    'id' | 'accountId' | 'amount' | 'baseInstrumentId' | 'baseExchangeRate' | 'baseAmount'
> &
    Pick<TransactionEntityInterface, 'operatedAt'>;
