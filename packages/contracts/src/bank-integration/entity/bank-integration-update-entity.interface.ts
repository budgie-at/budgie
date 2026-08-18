import { z } from 'zod';

import { BankIntegrationUpdateEntitySchema } from '../schema/bank-integration-update-entity.schema';

export type BankIntegrationUpdateEntityInterface = z.infer<typeof BankIntegrationUpdateEntitySchema>;
