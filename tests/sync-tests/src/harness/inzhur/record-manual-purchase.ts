import { InzhurManualPurchaseService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import type { InzhurManualPurchaseInputInterface } from '@budgie/sync';

export const recordManualPurchase = (input: InzhurManualPurchaseInputInterface) =>
    Effect.flatMap(InzhurManualPurchaseService, service => service.recordPurchase(input));
