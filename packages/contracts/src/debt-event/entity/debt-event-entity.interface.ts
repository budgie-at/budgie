import { z } from 'zod';

import { DebtEventEntitySchema } from '../schema/debt-event-entity.schema';

export type DebtEventEntityInterface = z.infer<typeof DebtEventEntitySchema>;
