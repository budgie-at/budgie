import { infer } from 'zod';

import { BuyAssetTransactionCreateEntitySchema } from '../schema/buy-asset-transaction-create-entity.schema';

export interface BuyAssetTransactionCreateEntityInterface extends infer<typeof BuyAssetTransactionCreateEntitySchema> {}
