import { PRECISION, TRANSFER_PAIR_TIME_WINDOW_SECONDS, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { transactionTransferService } from '../../transaction/service/transaction-transfer.service';

import type { UnpairedOwnCardTransferCandidateInterface } from '../interface/unpaired-own-card-transfer-candidate.interface';
import type { DB } from '@budgie/contracts';

class UnpairedOwnCardTransferRepairService {
    private static readonly COUNTERPART_AMOUNT_TOLERANCE = 500 * PRECISION;

    private static readonly CANDIDATES_SQL = String.raw`
        SELECT
            tx.id AS transactionId,
            tx.type AS transactionType,
            counterpart_account.id AS counterpartAccountId
        FROM transactions tx
        INNER JOIN transaction_entries entry ON
            entry.transaction_id = tx.id
            AND entry.deleted_at IS NULL
            AND entry.original_transaction_id IS NULL
            AND entry.kind = 'PRIMARY'
            AND entry.type = CASE WHEN tx.type = 'INCOME' THEN 'DEBIT' ELSE 'CREDIT' END
        INNER JOIN accounts own_account ON
            own_account.id = CASE WHEN tx.type = 'INCOME' THEN tx.to_account_id ELSE tx.from_account_id END
            AND own_account.deleted_at IS NULL
        INNER JOIN accounts counterpart_account ON
            counterpart_account.deleted_at IS NOT NULL
            AND counterpart_account.type = 'BANK_SYNC'
            AND counterpart_account.id != own_account.id
            AND (${UnpairedOwnCardTransferRepairService.buildCardMaskPredicate('counterpart_account')})
        WHERE tx.deleted_at IS NULL
            AND tx.consolidation_parent_transaction_id IS NULL
            AND tx.external_source = 'PRIVATBANK'
            AND tx.type IN ('INCOME', 'EXPENSE')
            AND (tx.from_account_id IS NULL OR tx.to_account_id IS NULL)
            AND INSTR(tx.title, '*') > 0
            AND (tx.title LIKE '%своєї картки%' OR tx.title LIKE '%свою картку%' OR tx.title LIKE '%мою картку%')
            AND entry.amount > 0
            AND (
                SELECT COUNT(*) FROM accounts archived_account
                WHERE archived_account.deleted_at IS NOT NULL
                    AND archived_account.type = 'BANK_SYNC'
                    AND (${UnpairedOwnCardTransferRepairService.buildCardMaskPredicate('archived_account')})
            ) = 1
            AND NOT EXISTS (
                SELECT 1 FROM transactions counterpart_tx
                INNER JOIN transaction_entries counterpart_entry ON
                    counterpart_entry.transaction_id = counterpart_tx.id
                    AND counterpart_entry.deleted_at IS NULL
                    AND counterpart_entry.original_transaction_id IS NULL
                    AND counterpart_entry.kind = 'PRIMARY'
                WHERE counterpart_tx.deleted_at IS NULL
                    AND counterpart_tx.id != tx.id
                    AND (
                        (tx.type = 'INCOME' AND counterpart_tx.type = 'EXPENSE' AND counterpart_tx.from_account_id = counterpart_account.id)
                        OR (tx.type = 'EXPENSE' AND counterpart_tx.type = 'INCOME' AND counterpart_tx.to_account_id = counterpart_account.id)
                    )
                    AND ABS(counterpart_tx.operated_at - tx.operated_at) <= ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}
                    AND counterpart_entry.amount >= entry.amount - ${UnpairedOwnCardTransferRepairService.COUNTERPART_AMOUNT_TOLERANCE}
            )
    `;

    @Log('enter', result => `done count=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countCandidates(): Promise<number> {
        return (await this.findCandidates(db)).length;
    }

    @Log('enter', result => `done repairedCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async repair(): Promise<number> {
        const candidates = await this.findCandidates(db);

        await candidates.reduce((previous, candidate) => previous.then(() => this.convertCandidate(candidate)), Promise.resolve());

        return candidates.length;
    }

    @Log(
        database => `enter database=${String(isDefined(database))}`,
        (result, database) => `done database=${String(isDefined(database))} candidateCount=${result.length}`,
        (error, database) => `throw database=${String(isDefined(database))} error=${getErrorMessage(error)}`
    )
    private async findCandidates(database: DB): Promise<UnpairedOwnCardTransferCandidateInterface[]> {
        return database.$client.getAllAsync<UnpairedOwnCardTransferCandidateInterface>(UnpairedOwnCardTransferRepairService.CANDIDATES_SQL);
    }

    @Log(
        candidate => `enter transactionId=${candidate.transactionId} counterpartAccountId=${candidate.counterpartAccountId}`,
        (_result, candidate) => `done transactionId=${candidate.transactionId} counterpartAccountId=${candidate.counterpartAccountId}`,
        (error, candidate) =>
            `throw transactionId=${candidate.transactionId} counterpartAccountId=${candidate.counterpartAccountId} error=${getErrorMessage(error)}`
    )
    private async convertCandidate(candidate: UnpairedOwnCardTransferCandidateInterface): Promise<void> {
        const params = { id: candidate.transactionId, accountId: candidate.counterpartAccountId, customExchangeRate: 1 };

        if (candidate.transactionType === TransactionTypeEnum.INCOME) {
            await transactionTransferService.convertIncomeToTransfer(params);
        } else {
            await transactionTransferService.convertExpenseToTransfer(params);
        }
    }

    private static buildCardMaskPredicate(accountAlias: string): string {
        return String.raw`
            (
                ${accountAlias}.external_id IS NOT NULL
                AND SUBSTR(${accountAlias}.external_id, -4) = SUBSTR(tx.title, INSTR(tx.title, '*') + 1, 4)
            )
            OR (
                ${accountAlias}.external_id IS NULL
                AND ${accountAlias}.iban IS NOT NULL
                AND SUBSTR(${accountAlias}.iban, -4) = SUBSTR(tx.title, INSTR(tx.title, '*') + 1, 4)
            )
        `;
    }
}

export const unpairedOwnCardTransferRepairService = new UnpairedOwnCardTransferRepairService();
