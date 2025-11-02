import type { StocksAccountCreateEntitySchema } from '../../schema/stocks/stocks-account-create-entity.schema';
import type { infer } from 'zod';

export interface StocksAccountCreateEntityInterface extends infer<typeof StocksAccountCreateEntitySchema> {}
