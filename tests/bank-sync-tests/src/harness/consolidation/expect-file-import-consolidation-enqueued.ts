import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { expect } from 'vitest';

export const expectFileImportConsolidationEnqueued = (transactionId: number | undefined): void => {
    expect(transactionId).toBeTypeOf('number');
    expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledTimes(1);
    expect(transferConsolidationDrainerService.enqueue).toHaveBeenCalledWith(
        TransferConsolidationDrainReasonEnum.FILE_IMPORT,
        expect.objectContaining({
            transactionIds: [transactionId]
        })
    );
};
