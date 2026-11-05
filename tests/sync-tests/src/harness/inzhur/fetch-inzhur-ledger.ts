import { ExternalSourceEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { fetchSourceLedger } from './fetch-source-ledger';
import { INZHUR_BEFORE_TRACKING_EXTERNAL_ID } from './inzhur-before-tracking-external-id.constant';

export const fetchInzhurLedger = () =>
    Effect.map(fetchSourceLedger(ExternalSourceEnum.INZHUR), ledger =>
        ledger.filter(transaction => transaction.externalId !== INZHUR_BEFORE_TRACKING_EXTERNAL_ID)
    );
