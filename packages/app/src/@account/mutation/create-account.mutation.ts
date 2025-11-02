import { AccountEntityTable } from '@budgie/contracts';

import { db } from '../../drizzle/db/db';

import type { BankAccountCreateEntityInterface } from '@budgie/contracts';

export const createAccountMutation = async (input: BankAccountCreateEntityInterface) => db.insert(AccountEntityTable).values([input]);
