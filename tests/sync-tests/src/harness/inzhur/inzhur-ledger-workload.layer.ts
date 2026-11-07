import { LedgerWorkload } from '@budgie/ledger';
import * as Layer from 'effect/Layer';

export const inzhurLedgerWorkloadLayer = Layer.succeed(LedgerWorkload, LedgerWorkload.of({ runForeground: effect => effect }));
