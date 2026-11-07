import { ExternalSourceEnum } from '@budgie/contracts';

import { fetchSourceLedger } from './fetch-source-ledger';

export const fetchBankTransactions = fetchSourceLedger(ExternalSourceEnum.MONOBANK);
