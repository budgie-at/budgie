import { z } from 'zod';

import { BankIntegrationCreateEntitySchema } from '../schema/bank-integration-create-entity.schema';

export type BankIntegrationCreateEntityInterface = z.infer<typeof BankIntegrationCreateEntitySchema>;
