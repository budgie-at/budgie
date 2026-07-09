import { z } from 'zod';

import { DebtEventCreateEntitySchema } from '../schema/debt-event-create-entity.schema';

export type DebtEventCreateEntityInterface = z.infer<typeof DebtEventCreateEntitySchema>;
