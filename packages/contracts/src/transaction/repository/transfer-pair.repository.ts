import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import {
    buildTransferPairCandidatesSql,
    buildTransferPairManualReviewCandidatesSql
} from './sql-factory/transfer-pair-candidate-sql.factory';
import {
    buildAtmCashWithdrawalCandidatesSql,
    buildAtmCashWithdrawalReviewCandidatesSql
} from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';
import { IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-duplicate-sql.factory';
import { IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-chain-sql.factory';
import { IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-transfer-sql.factory';

import type { DB } from '../../@generic/type/db.type';
import type { AtmCashWithdrawalCandidateInterface } from '../interface/atm-cash-withdrawal-candidate.interface';
import type { AtmCashWithdrawalReviewCandidateInterface } from '../interface/atm-cash-withdrawal-review-candidate.interface';
import type { IbanBridgeCanonicalDuplicateCandidateInterface } from '../interface/iban-bridge-canonical-duplicate-candidate.interface';
import type { IbanBridgeChainTransferCandidateInterface } from '../interface/iban-bridge-chain-transfer-candidate.interface';
import type { IbanBridgeTransferCandidateInterface } from '../interface/iban-bridge-transfer-candidate.interface';
import type { TransferPairCandidateInterface } from '../interface/transfer-pair-candidate.interface';
import type { TransferPairReviewCandidateInterface } from '../interface/transfer-pair-review-candidate.interface';

export class TransferPairRepository {
    constructor(private db: DB) {}

    @Log(
        'enter',
        result =>
            `done buckets=${result.map(candidate => candidate.confidenceBucket).join(',')} matchTypes=${result.map(candidate => candidate.matchType).join(',')} expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findCandidates(): Promise<TransferPairCandidateInterface[]> {
        const sql = buildTransferPairCandidatesSql();

        return this.db.$client.getAllAsync<TransferPairCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done buckets=${result.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')} timeDiffs=${result.map(candidate => candidate.timeDiff).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        const sql = buildTransferPairManualReviewCandidatesSql();

        return this.db.$client.getAllAsync<TransferPairReviewCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${result.map(candidate => candidate.targetCashAccountId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findAtmCashWithdrawalCandidates(): Promise<AtmCashWithdrawalCandidateInterface[]> {
        const sql = buildAtmCashWithdrawalCandidatesSql();

        return this.db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')} cashAccountCounts=${result.map(candidate => candidate.cashAccountCount).join(',')} cashAccountIds=${result.map(candidate => candidate.cashAccountIds ?? '').join('|')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findAtmCashWithdrawalReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        const sql = buildAtmCashWithdrawalReviewCandidatesSql();

        return this.db.$client.getAllAsync<AtmCashWithdrawalReviewCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')} sourceAccountIds=${result.map(candidate => candidate.sourceAccountId).join(',')} targetAccountIds=${result.map(candidate => candidate.targetAccountId).join(',')} existingDirectTransferIds=${result.map(candidate => candidate.existingDirectTransferId ?? '').join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findIbanBridgeTransferCandidates(): Promise<IbanBridgeTransferCandidateInterface[]> {
        const sql = IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL;

        return this.db.$client.getAllAsync<IbanBridgeTransferCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')} existingCanonicalTransferIds=${result.map(candidate => candidate.existingCanonicalTransferId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findIbanBridgeCanonicalDuplicateCandidates(): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        const sql = IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL;

        return this.db.$client.getAllAsync<IbanBridgeCanonicalDuplicateCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done sourceExpenseTransactionIds=${result.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${result.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} bridgeExpenseTransactionIds=${result.map(candidate => candidate.bridgeExpenseTransactionId).join(',')} targetIncomeTransactionIds=${result.map(candidate => candidate.targetIncomeTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findIbanBridgeChainTransferCandidates(): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        const sql = IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL;

        return this.db.$client.getAllAsync<IbanBridgeChainTransferCandidateInterface>(sql);
    }
}
