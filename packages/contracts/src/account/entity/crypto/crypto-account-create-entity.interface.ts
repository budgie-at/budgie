import type { CryptoAccountCreateEntitySchema } from '../../schema/crypto/crypto-account-create-entity.schema';
import type { infer } from 'zod';

export interface CryptoAccountCreateEntityInterface extends infer<typeof CryptoAccountCreateEntitySchema> {}
