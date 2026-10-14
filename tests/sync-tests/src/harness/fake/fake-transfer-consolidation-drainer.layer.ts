import { TransferConsolidationDrainerService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const fakeTransferConsolidationDrainerLayer = Layer.sync(TransferConsolidationDrainerService, () =>
    TransferConsolidationDrainerService.of({
        enqueue: vi.fn((_scope?: ConsolidationScanScopeInterface | null) => Effect.void),
        cancelPending: vi.fn(() => Effect.void)
    })
);
