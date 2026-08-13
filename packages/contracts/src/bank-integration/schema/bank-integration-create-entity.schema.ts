import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BankIntegrationEntitySchema } from './bank-integration-entity.schema';

export const BankIntegrationCreateEntitySchema = convertToCreateEntitySchema(BankIntegrationEntitySchema);
