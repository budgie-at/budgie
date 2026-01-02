import { MccGroupEntitySchema } from './mcc-group-entity.schema';

export const MccGroupCreateEntitySchema = MccGroupEntitySchema.pick({
    type: true,
    description: true
});
