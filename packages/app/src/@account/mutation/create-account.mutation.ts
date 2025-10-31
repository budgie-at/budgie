import { AccountEntityTable } from '@budgie/contracts';

import { db } from '../../drizzle/db/db';

import type { AccountCreateEntityInterface } from '@budgie/contracts';

export const createAccountMutation = async (input: AccountCreateEntityInterface) => db.insert(AccountEntityTable).values([input]);
