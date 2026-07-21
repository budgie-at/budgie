import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { isDefined, isError } from '@rnw-community/shared';

import type { UnconsolidationDependenciesInterface } from '../interface/unconsolidation-dependencies.interface';
import type { DB, TransactionEntityInterface } from '@budgie/contracts';

export class UnconsolidationService {
    constructor(private readonly dependencies: UnconsolidationDependenciesInterface) {}

    @Log.withoutErrorPayload(() => 'enter', () => 'done', error => `throw errorClass=${isError(error) ? error.name : 'UnknownError'}`)
    async unconsolidateById(transactionId: number, tx: DB): Promise<void> {
        const canonical = await this.dependencies.transactionRepository.getByIdRaw(transactionId, tx);

        await this.dependencies.transactionEntryRepository.moveBackToOriginalTransactions(transactionId, tx);
        await this.dependencies.transactionRepository.clearConsolidationParent(transactionId, tx);

        if (this.isRefundCanonical(canonical)) {
            await this.dependencies.transactionRepository.setConsolidationType(transactionId, null, tx);

            return;
        }

        await this.dependencies.transactionTagsRepository.deleteByTransactionId(transactionId, tx);
        await this.dependencies.transactionEntryRepository.deleteLedgerByTransactionId(transactionId, tx);
        await this.dependencies.transactionRepository.deleteById(transactionId, tx);
    }

    private isRefundCanonical(transaction: TransactionEntityInterface | undefined): boolean {
        return isDefined(transaction) && transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    }
}
