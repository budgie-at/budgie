import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { ConsolidationPlanInterface } from '../interface/consolidation-plan.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationPlanBuilderService {
    buildPair(candidate: TransferPairCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: [candidate.expenseTransactionId, candidate.incomeTransactionId],
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.expenseEntryAccountId,
                toAccountId: candidate.incomeEntryAccountId,
                fromAmount: candidate.expenseEntryAmount,
                toAmount: candidate.incomeEntryAmount,
                exchangeRate: this.computePairExchangeRate(candidate),
                consolidationType: this.getPairConsolidationType(candidate),
                fromEntryExchangeRate: candidate.expenseEntryExchangeRate,
                toEntryExchangeRate: candidate.incomeEntryExchangeRate,
                fromEntryToIban: candidate.expenseEntryToIban
            }
        };
    }

    buildAtmCashWithdrawal(candidate: AtmCashWithdrawalCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: [candidate.transactionId],
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title: candidate.transactionTitle ?? '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetCashAccountId,
                fromAmount: candidate.amount,
                toAmount: candidate.amount,
                exchangeRate: 1,
                consolidationType: TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL,
                fromEntryExchangeRate: 1,
                toEntryExchangeRate: 1,
                fromEntryToIban: null
            }
        };
    }

    buildIbanBridgeTransfer(candidate: IbanBridgeTransferCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: this.buildBridgeSourceTransactionIds(candidate),
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title: candidate.expenseTransactionTitle ?? candidate.incomeTransactionTitle ?? '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.bridgeAmount,
                exchangeRate: candidate.exchangeRate,
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
                fromEntryExchangeRate: candidate.exchangeRate,
                toEntryExchangeRate: 1,
                fromEntryToIban: candidate.expenseEntryToIban
            }
        };
    }

    buildExistingTransferBridge(candidate: ExistingTransferBridgeCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: [candidate.sourceExpenseTransactionId, candidate.bridgeIncomeTransactionId, candidate.existingTransferId],
            allowedMovedSourceTransactionIds: [candidate.existingTransferId],
            canonicalInput: {
                title:
                    candidate.existingTransferTitle ??
                    candidate.sourceExpenseTransactionTitle ??
                    candidate.bridgeIncomeTransactionTitle ??
                    '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.targetAmount,
                exchangeRate: candidate.exchangeRate,
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
                fromEntryExchangeRate: candidate.exchangeRate,
                toEntryExchangeRate: 1,
                fromEntryToIban: candidate.sourceExpenseEntryToIban
            }
        };
    }

    buildIbanBridgeChainTransfer(candidate: IbanBridgeChainTransferCandidateInterface): ConsolidationPlanInterface {
        return {
            sourceTransactionIds: [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.bridgeExpenseTransactionId,
                candidate.targetIncomeTransactionId
            ],
            allowedMovedSourceTransactionIds: [],
            canonicalInput: {
                title:
                    candidate.bridgeExpenseTransactionTitle ??
                    candidate.sourceExpenseTransactionTitle ??
                    candidate.targetIncomeTransactionTitle ??
                    candidate.bridgeIncomeTransactionTitle ??
                    '',
                operatedAt: candidate.operatedAt,
                fromAccountId: candidate.sourceAccountId,
                toAccountId: candidate.targetAccountId,
                fromAmount: candidate.sourceAmount,
                toAmount: candidate.targetAmount,
                exchangeRate: candidate.exchangeRate,
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                fromEntryExchangeRate: candidate.exchangeRate,
                toEntryExchangeRate: 1,
                fromEntryToIban: candidate.sourceExpenseEntryToIban
            }
        };
    }

    private computePairExchangeRate(candidate: TransferPairCandidateInterface): number {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE' || candidate.confidenceBucket === 'AUTO_INTERBANK_HINTED_FEE') {
            return 1;
        }

        if (candidate.expenseEntryAmount === candidate.incomeEntryAmount) {
            return 1;
        }

        return candidate.expenseEntryAmount / candidate.incomeEntryAmount;
    }

    private getPairConsolidationType(candidate: TransferPairCandidateInterface): TransactionConsolidationTypeEnum {
        if (candidate.confidenceBucket === 'AUTO_SAME_BANK_HINTED_FEE') {
            return TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER;
        }

        return TransactionConsolidationTypeEnum.TRANSFER_PAIR;
    }

    private buildBridgeSourceTransactionIds(candidate: IbanBridgeTransferCandidateInterface): number[] {
        const sourceTransactionIds = [candidate.expenseTransactionId, candidate.incomeTransactionId];

        if (isDefined(candidate.existingDirectTransferId)) {
            return [...sourceTransactionIds, candidate.existingDirectTransferId];
        }

        return sourceTransactionIds;
    }
}
