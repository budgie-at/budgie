import { ExternalSourceEnum } from '@budgie/contracts';

import { fetchSourceLedger } from './fetch-source-ledger';

export const fetchInzhurLedger = () => fetchSourceLedger(ExternalSourceEnum.INZHUR);
