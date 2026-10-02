import { TransferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

export const expectFileImportConsolidationEnqueued = Effect.fnUntraced(function* (transactionId: number | undefined) {
    const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;

    expect(transactionId).toBeTypeOf('number');
    expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledTimes(1);
    expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
            transactionIds: [transactionId]
        })
    );
});
