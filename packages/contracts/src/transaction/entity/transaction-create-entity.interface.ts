import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { TransactionEntityInterface } from './transaction-entity.interface';

export type TransactionCreateEntityInterface = PartialByKeysType<
    Omit<TransactionEntityInterface, BaseEntityKeyType | 'operatedWeekday' | 'operatedMinuteOfDay'>,
    'consolidationParentTransactionId' | 'consolidationType' | 'needsEmbedding' | 'importFingerprint'
>;
