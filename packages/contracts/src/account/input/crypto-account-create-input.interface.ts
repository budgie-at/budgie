import { z } from 'zod';

import { CryptoAccountCreateInputSchema } from '../schema/crypto-account-create-input.schema';

export type CryptoAccountCreateInputInterface = z.infer<typeof CryptoAccountCreateInputSchema>;
