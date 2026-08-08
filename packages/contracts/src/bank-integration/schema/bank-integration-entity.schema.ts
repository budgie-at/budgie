import { createSelectSchema } from 'drizzle-zod';
import { string, enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { BankIntegrationEntityTable } from '../table/bank-integration-entity.table';

export const BankIntegrationEntitySchema = createSelectSchema(BankIntegrationEntityTable, {
    ...BaseEntityFields,
    provider: zodEnum(ExternalSourceEnum).describe('The bank provider for this integration.'),
    token: string().min(1).describe('API token shared by every account linked to this integration.')
});
