import { z } from 'zod';

import { BankIntegrationEntitySchema } from '../schema/bank-integration-entity.schema';

export type BankIntegrationEntityInterface = z.infer<typeof BankIntegrationEntitySchema>;
