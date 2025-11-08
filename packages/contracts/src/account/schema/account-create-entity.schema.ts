import { AccountEntitySchema } from './account-entity.schema';

export const AccountCreateEntitySchema = AccountEntitySchema.pick({
    type: true,
    icon: true,
    order: true,
    title: true,
    nature: true,
    parentId: true,
    externalId: true,
    instrumentId: true,
    externalSource: true,
    includeInNetWorth: true
}).partial({
    order: true,
    nature: true,
    parentId: true,
    externalId: true,
    externalSource: true,
    includeInNetWorth: true
});
