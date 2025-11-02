import type { StocksAccountEntitySchema } from '../../schema/stocks/stocks-account-entity.schema';
import type { infer } from 'zod';

export interface StocksAccountEntityInterface extends infer<typeof StocksAccountEntitySchema> {}
