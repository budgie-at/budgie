import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankIntegrationAssociationEnum } from '../enum/bank-integration-association.enum';
import { BankIntegrationEntityTable } from '../table/bank-integration-entity.table';

export const BankIntegrationEntityRelations = relations(BankIntegrationEntityTable, ({ many }) => ({
    [BankIntegrationAssociationEnum.ACCOUNTS]: many(AccountEntityTable)
}));
