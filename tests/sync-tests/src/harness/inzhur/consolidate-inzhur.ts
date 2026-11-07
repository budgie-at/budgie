import { TransferConsolidationService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

export const consolidateInzhur = Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));
