import { InzhurManualPurchaseService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

export const findPendingTopUps = Effect.flatMap(InzhurManualPurchaseService, service => service.findPendingTopUps());
