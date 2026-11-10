import { TransferConsolidationService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';

export const consolidateInzhur = Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));
