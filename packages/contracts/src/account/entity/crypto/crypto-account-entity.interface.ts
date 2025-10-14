import type { CryptoAccountEntitySchema } from '../../schema/crypto/crypto-account-entity.schema';
import type { infer } from 'zod';

export interface CryptoAccountEntityInterface extends infer<typeof CryptoAccountEntitySchema> {
}
