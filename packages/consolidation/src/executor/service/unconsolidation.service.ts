import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { buildAtmFeeTransactionExternalId } from '../utils/build-atm-fee-transaction-external-id.util';

import type { UnconsolidationDependenciesInterface } from '../interface/unconsolidation-dependencies.interface';
import type { DB, TransactionEntityInterface } from '@budgie/contracts';

export class UnconsolidationService {
    constructor(private readonly dependencies: UnconsolidationDependenciesInterface) {}

    @Log(
        (transactionId, tx) => `enter transactionId=${transactionId} hasTx=${String(isDefined(tx))}`,
        (result, transactionId, tx) => `done result=${String(result)} transactionId=${transactionId} hasTx=${String(isDefined(tx))}`,
        (error, transactionId, tx) => `throw transactionId=${transactionId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async unconsolidateById(transactionId: number, tx: DB): Promise<void> {
        const canonical = await this.dependencies.transactionRepository.getByIdRaw(transactionId, tx);

        await this.dependencies.transactionEntryRepository.moveBackToOriginalTransactions(transactionId, tx);
        await this.dependencies.transactionRepository.clearConsolidationParent(transactionId, tx);

        if (this.isRefundCanonical(canonical)) {
            await this.dependencies.transactionRepository.setConsolidationType(transactionId, null, tx);

            return;
        }

        if (this.isAtmCashWithdrawalCanonical(canonical)) {
            await this.deleteGeneratedAtmFeeTransaction(transactionId, tx);
        }

        await this.dependencies.transactionTagsRepository.deleteByTransactionId(transactionId, tx);
        await this.dependencies.transactionEntryRepository.deleteLedgerByTransactionId(transactionId, tx);
        await this.dependencies.transactionRepository.deleteById(transactionId, tx);
    }

    private isRefundCanonical(transaction: TransactionEntityInterface | undefined): boolean {
        return isDefined(transaction) && transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    }

    private isAtmCashWithdrawalCanonical(transaction: TransactionEntityInterface | undefined): boolean {
        return isDefined(transaction) && transaction.consolidationType === TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL;
    }

    private async deleteGeneratedAtmFeeTransaction(canonicalTransactionId: number, tx: DB): Promise<void> {
        const generatedFeeTransaction = await this.dependencies.transactionRepository.findByExternalId(
            buildAtmFeeTransactionExternalId(canonicalTransactionId),
            tx
        );

        if (!isDefined(generatedFeeTransaction)) {
            return;
        }

        await this.dependencies.transactionTagsRepository.deleteByTransactionId(generatedFeeTransaction.id, tx);
        await this.dependencies.transactionEntryRepository.deleteByTransactionId(generatedFeeTransaction.id, tx);
        await this.dependencies.transactionRepository.deleteById(generatedFeeTransaction.id, tx);
    }
}
