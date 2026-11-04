import {
    Db,
    PRECISION,
    TRANSFER_PAIR_TIME_WINDOW_SECONDS,
    TransactionEntityTable,
    TransactionRepository,
    TransactionTypeEnum,
    transactionFilters
} from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { and, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { UnpairedOwnCardTransferCandidateInterface } from '../interface/unpaired-own-card-transfer-candidate.interface';

export class UnpairedOwnCardTransferRepairService extends Context.Service<UnpairedOwnCardTransferRepairService>()(
    '@budgie/sync/UnpairedOwnCardTransferRepairService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const transactionTransferService = yield* TransactionTransferService;
            const counterpartAmountTolerance = 500 * PRECISION;

            const buildCardMaskPredicate = (accountAlias: string): string => String.raw`
                    (
                        ${accountAlias}.external_id IS NOT NULL
                        AND SUBSTR(${accountAlias}.external_id, -4) = SUBSTR(transactions.title, INSTR(transactions.title, '*') + 1, 4)
                    )
                    OR (
                        ${accountAlias}.external_id IS NULL
                        AND ${accountAlias}.iban IS NOT NULL
                        AND SUBSTR(${accountAlias}.iban, -4) = SUBSTR(transactions.title, INSTR(transactions.title, '*') + 1, 4)
                    )
                `;

            const candidatesSql = sql`
                SELECT
                    transactions.id AS transactionId,
                    transactions.type AS transactionType,
                    counterpart_account.id AS counterpartAccountId,
                    (
                        SELECT superseded_candidate.id FROM (
                            SELECT
                                superseded_tx.id AS id,
                                ABS(superseded_tx.operated_at - transactions.operated_at) AS distance
                            FROM transactions superseded_tx
                            INNER JOIN transaction_entries superseded_entry ON
                                superseded_entry.transaction_id = superseded_tx.id
                                AND superseded_entry.deleted_at IS NOT NULL
                                AND superseded_entry.original_transaction_id IS NULL
                                AND superseded_entry.kind = 'PRIMARY'
                            WHERE superseded_tx.deleted_at IS NOT NULL
                                AND superseded_tx.updated_by IS NULL
                                AND superseded_tx.id != transactions.id
                                AND (
                                    (transactions.type = 'INCOME' AND superseded_tx.type = 'EXPENSE' AND superseded_tx.from_account_id = counterpart_account.id)
                                    OR (transactions.type = 'EXPENSE' AND superseded_tx.type = 'INCOME' AND superseded_tx.to_account_id = counterpart_account.id)
                                )
                                AND ABS(superseded_tx.operated_at - transactions.operated_at) <= ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}
                                AND superseded_entry.amount >= transaction_entries.amount - ${counterpartAmountTolerance}
                        ) superseded_candidate
                        ORDER BY superseded_candidate.distance
                        LIMIT 1
                    ) AS supersededTransactionId
                FROM transactions
                INNER JOIN transaction_entries ON
                    transaction_entries.transaction_id = transactions.id
                    AND ${transactionFilters.buildPrimaryLedgerEntryCondition()}
                    AND transaction_entries.type = CASE WHEN transactions.type = 'INCOME' THEN 'DEBIT' ELSE 'CREDIT' END
                INNER JOIN accounts own_account ON
                    own_account.id = CASE WHEN transactions.type = 'INCOME' THEN transactions.to_account_id ELSE transactions.from_account_id END
                    AND own_account.deleted_at IS NULL
                    AND own_account.is_external = 0
                INNER JOIN accounts counterpart_account ON
                    counterpart_account.deleted_at IS NOT NULL
                    AND counterpart_account.is_external = 0
                    AND counterpart_account.type = 'BANK_SYNC'
                    AND counterpart_account.id != own_account.id
                    AND (${sql.raw(buildCardMaskPredicate('counterpart_account'))})
                WHERE ${and(transactionFilters.buildVisibleTransactionCondition(), isNull(TransactionEntityTable.updatedBy))}
                    AND transactions.external_source = 'PRIVATBANK'
                    AND transactions.type IN ('INCOME', 'EXPENSE')
                    AND (transactions.from_account_id IS NULL OR transactions.to_account_id IS NULL)
                    AND INSTR(transactions.title, '*') > 0
                    AND (transactions.title LIKE '%своєї картки%' OR transactions.title LIKE '%свою картку%' OR transactions.title LIKE '%мою картку%')
                    AND transaction_entries.amount > 0
                    AND (
                        SELECT COUNT(*) FROM accounts archived_account
                        WHERE archived_account.deleted_at IS NOT NULL
                            AND archived_account.is_external = 0
                            AND archived_account.id != own_account.id
                            AND archived_account.type = 'BANK_SYNC'
                            AND (${sql.raw(buildCardMaskPredicate('archived_account'))})
                    ) = 1
                    AND NOT EXISTS (
                        SELECT 1 FROM transactions counterpart_tx
                        INNER JOIN transaction_entries counterpart_entry ON
                            counterpart_entry.transaction_id = counterpart_tx.id
                            AND counterpart_entry.deleted_at IS NULL
                            AND counterpart_entry.original_transaction_id IS NULL
                            AND counterpart_entry.kind = 'PRIMARY'
                        WHERE counterpart_tx.deleted_at IS NULL
                            AND counterpart_tx.id != transactions.id
                            AND (
                                (transactions.type = 'INCOME' AND counterpart_tx.type = 'EXPENSE' AND counterpart_tx.from_account_id = counterpart_account.id)
                                OR (transactions.type = 'EXPENSE' AND counterpart_tx.type = 'INCOME' AND counterpart_tx.to_account_id = counterpart_account.id)
                            )
                            AND ABS(counterpart_tx.operated_at - transactions.operated_at) <= ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}
                            AND counterpart_entry.amount >= transaction_entries.amount - ${counterpartAmountTolerance}
                    )
            `;

            const findCandidates = Effect.fnUntraced(function* () {
                return yield* Db.query(db => db.all<UnpairedOwnCardTransferCandidateInterface>(candidatesSql));
            });

            const convertCandidate = Effect.fnUntraced(function* (candidate: UnpairedOwnCardTransferCandidateInterface) {
                const params = {
                    id: candidate.transactionId,
                    accountId: candidate.counterpartAccountId,
                    customExchangeRate: 1,
                    feeEntries: []
                };

                if (candidate.transactionType === TransactionTypeEnum.INCOME) {
                    yield* transactionTransferService.convertIncomeToTransfer(params);
                } else {
                    yield* transactionTransferService.convertExpenseToTransfer(params);
                }

                if (isDefined(candidate.supersededTransactionId)) {
                    yield* transactionRepository.deleteById(candidate.supersededTransactionId);
                }
            });

            return {
                countCandidates: Effect.fn('UnpairedOwnCardTransferRepairService.countCandidates')(function* () {
                    return (yield* findCandidates()).length;
                }),
                repair: Effect.fn('UnpairedOwnCardTransferRepairService.repair')(function* () {
                    const candidates = yield* findCandidates();

                    for (const candidate of candidates) {
                        yield* convertCandidate(candidate);
                    }

                    return candidates.length;
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(UnpairedOwnCardTransferRepairService, UnpairedOwnCardTransferRepairService.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionTransferService.layer])
    );
}
