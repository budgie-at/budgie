import { AccountTypeEnum } from '@budgie/contracts';

import type { AccountFilterInterface } from '@budgie/contracts';

export const CATEGORIZE_INBOX_TRANSFER_ACCOUNT_FILTER: AccountFilterInterface = { onlyActive: true, excludeTypes: [AccountTypeEnum.DEBT] };
