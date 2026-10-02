import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class FakeTransferConsolidationDrainerService extends Context.Service<
    FakeTransferConsolidationDrainerService,
    {
        readonly enqueue: (scope?: ConsolidationScanScopeInterface | null) => Effect.Effect<void>;
        readonly cancelPending: () => Effect.Effect<void>;
    }
>()('@budgie/app/TransferConsolidationDrainerService') {
    static readonly layer = Layer.sync(FakeTransferConsolidationDrainerService, () => ({
        enqueue: vi.fn((_scope?: ConsolidationScanScopeInterface | null) => Effect.void),
        cancelPending: vi.fn(() => Effect.void)
    }));
}
