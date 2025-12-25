import { z } from 'zod';

import { MonobankAccountApiSchema } from './monobank-account-api.schema';
import { MonobankJarApiSchema } from './monobank-jar-api.schema';

export const MonobankClientInfoApiSchema = z.object({
    clientId: z.string(),
    name: z.string(),
    webHookUrl: z.string(),
    permissions: z.string(),
    accounts: z.array(MonobankAccountApiSchema),
    jars: z.array(MonobankJarApiSchema)
});
