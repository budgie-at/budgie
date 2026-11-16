import {
    AccountRepository,
    AccountTypeEnum,
    Db,
    ExternalSourceEnum,
    SyncRepository,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountArchiveService, AccountBalanceIncrementalService, TransactionService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { PRIVATBANK_CARD_REISSUE_EVIDENCE_SQL } from '../../privatbank/constant/privatbank-card-reissue-evidence-sql.constant';
import { isPrivatbankOwnCardTransferTitle } from '../../privatbank/utils/is-privatbank-own-card-transfer-title.util';
import { matchUnconsolidatedTransferLegs } from '../utils/match-unconsolidated-transfer-legs.util';

import type { AccountReissueCandidateInterface } from '../interface/account-reissue-candidate.interface';
import type { ArchivedAccountDuplicateCandidateInterface } from '../interface/archived-account-duplicate-candidate.interface';
import type { TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class AccountReissueMergeService extends Context.Service<AccountReissueMergeService>()('@budgie/sync/AccountReissueMergeService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const accountArchiveService = yield* AccountArchiveService;
        const transactionRepository = yield* TransactionRepository;
        const transactionService = yield* TransactionService;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const syncRepository = yield* SyncRepository;

        const buildBankRowsSql = (accountColumn: string): string => String.raw`
            SELECT sync.account_id, sync.provider, tx.operated_at, TRIM(tx.title) AS title
            FROM bank_syncs sync
            INNER JOIN accounts account ON account.id = sync.account_id AND account.deleted_at IS NULL AND account.is_external = 0
            INNER JOIN transactions tx ON tx.${accountColumn} = sync.account_id AND tx.external_source = sync.provider AND tx.deleted_at IS NULL
            WHERE sync.deleted_at IS NULL
        `;

        const candidatesSql = String.raw`
            WITH bank_rows AS (${buildBankRowsSql('from_account_id')} UNION ALL ${buildBankRowsSql('to_account_id')}),
            spans AS (
                SELECT
                    bank_rows.account_id,
                    bank_rows.provider,
                    account.instrument_id,
                    account.external_id,
                    account.iban,
                    account.integration_id,
                    account.is_active,
                    account.title,
                    MIN(bank_rows.operated_at) AS first_at,
                    MAX(bank_rows.operated_at) AS last_at
                FROM bank_rows
                INNER JOIN accounts account ON account.id = bank_rows.account_id
                GROUP BY bank_rows.account_id
            )
            SELECT
                predecessor.title AS predecessorTitle,
                predecessor.account_id AS predecessorAccountId,
                predecessor.external_id AS predecessorExternalId,
                successor.account_id AS successorAccountId,
                successor.first_at AS successorFirstAt,
                successor.last_at AS successorLastAt,
                successor.external_id AS externalId,
                successor.iban AS iban,
                COALESCE(successor.integration_id, predecessor.integration_id) AS integrationId,
                MAX(predecessor.is_active, successor.is_active) AS isActive
            FROM spans successor
            INNER JOIN spans predecessor ON
                predecessor.account_id != successor.account_id
                AND predecessor.provider = successor.provider
                AND predecessor.instrument_id = successor.instrument_id
                AND predecessor.last_at < successor.first_at
            WHERE (predecessor.iban = successor.iban AND CAST(SUBSTR(successor.iban, 3, 2) AS INTEGER) BETWEEN 2 AND 98)
                OR (successor.provider = '${ExternalSourceEnum.PRIVATBANK}' AND ${PRIVATBANK_CARD_REISSUE_EVIDENCE_SQL})
            ORDER BY successor.first_at, successor.account_id
        `;

        const buildSameCardCountSql = (deletedCondition: string): string => String.raw`
            SELECT COUNT(*) FROM accounts same_card
            WHERE same_card.deleted_at ${deletedCondition}
                AND same_card.is_external = 0
                AND same_card.type = '${AccountTypeEnum.BANK_SYNC}'
                AND same_card.external_source = live.external_source
                AND same_card.external_id = live.external_id
        `;

        const archivedDuplicatesSql = String.raw`
            SELECT
                live.id AS liveAccountId,
                archived.id AS archivedAccountId,
                live.external_source AS externalSource,
                COALESCE(live.integration_id, archived.integration_id) AS integrationId,
                MAX(live.is_active, archived.is_active) AS isActive
            FROM accounts live
            INNER JOIN accounts archived ON
                archived.id != live.id
                AND archived.deleted_at IS NOT NULL
                AND archived.is_external = 0
                AND archived.type = live.type
                AND archived.external_source = live.external_source
                AND archived.instrument_id = live.instrument_id
                AND archived.external_id = live.external_id
            WHERE live.deleted_at IS NULL
                AND live.is_external = 0
                AND live.type = '${AccountTypeEnum.BANK_SYNC}'
                AND live.external_id IS NOT NULL
                AND (${buildSameCardCountSql('IS NOT NULL')}) = 1
                AND (${buildSameCardCountSql('IS NULL')}) = 1
            ORDER BY live.id
        `;

        const reassignReferencesSql = [
            'UPDATE transactions SET from_account_id = ? WHERE from_account_id = ?',
            'UPDATE transactions SET to_account_id = ? WHERE to_account_id = ?',
            'UPDATE transactions SET fund_account_id = ? WHERE fund_account_id = ?',
            'UPDATE transactions SET yield_source_account_id = ? WHERE yield_source_account_id = ?',
            'UPDATE recurring_series SET account_id = ? WHERE account_id = ?',
            'UPDATE transaction_entries SET account_id = ? WHERE account_id = ?',
            'UPDATE debt_events SET debt_account_id = ? WHERE debt_account_id = ?',
            'UPDATE rule_actions SET account_id = ? WHERE account_id = ?',
            "UPDATE rule_conditions SET value = CAST(? AS TEXT) WHERE field = 'ACCOUNT_ID' AND value = CAST(? AS TEXT)",
            'UPDATE settings SET default_account_id = ? WHERE default_account_id = ?',
            'UPDATE accounts SET parent_id = ? WHERE parent_id = ?',
            'UPDATE account_external_ids SET account_id = ? WHERE account_id = ?',
            'DELETE FROM bank_syncs WHERE account_id = ? AND EXISTS (SELECT 1 FROM bank_syncs WHERE account_id = ?)',
            'UPDATE bank_syncs SET account_id = ? WHERE account_id = ?',
            'DELETE FROM account_balances WHERE account_id IN (?, ?)'
        ];

        const resolveMergedTitle = ({ predecessorTitle, predecessorExternalId, externalId }: AccountReissueCandidateInterface) => {
            if (!isDefined(predecessorExternalId) || !isDefined(externalId)) {
                return null;
            }

            const previousCardSuffix = `•${predecessorExternalId.slice(-4)}`;

            return predecessorTitle.endsWith(previousCardSuffix)
                ? `${predecessorTitle.slice(0, -previousCardSuffix.length)}•${externalId.slice(-4)}`
                : null;
        };

        const reassignReferences = (targetAccountId: number, sourceAccountId: number) =>
            Db.mutation(
                {
                    type: 'update',
                    tables: [
                        'transactions',
                        'transaction_entries',
                        'debt_events',
                        'rule_actions',
                        'rule_conditions',
                        'settings',
                        'accounts',
                        'account_external_ids',
                        'bank_syncs',
                        'account_balances',
                        'recurring_series'
                    ]
                },
                Effect.forEach(
                    reassignReferencesSql,
                    statement => Db.query(db => db.$client.unsafe(statement, [targetAccountId, sourceAccountId]).raw),
                    { discard: true }
                )
            );

        const isDeletableOneSidedRow = Effect.fnUntraced(function* (
            transaction: TransactionWithEntriesEntityInterface | undefined,
            accountId: number
        ) {
            if (
                !isDefined(transaction) ||
                isDefined(transaction.consolidationType) ||
                isDefined(transaction.consolidationParentTransactionId) ||
                transaction.entries.some(entry => entry.accountId !== accountId)
            ) {
                return false;
            }

            return !(yield* transactionRepository.isForeignTransferLeg(transaction.id));
        });

        const findSharedExternalIdDuplicateIds = Effect.fnUntraced(function* (
            liveAccountId: number,
            archivedAccountId: number,
            externalSource: ExternalSourceEnum
        ) {
            const liveExternalIds = yield* transactionRepository.findIdMapByExternalSource(externalSource, [liveAccountId]);
            const archivedExternalIds = yield* transactionRepository.findIdMapByExternalSource(externalSource, [archivedAccountId]);
            const pairs = [...archivedExternalIds].flatMap(([externalId, archivedTransactionId]) => {
                const liveTransactionId = liveExternalIds.get(externalId);

                return isDefined(liveTransactionId) && liveTransactionId !== archivedTransactionId
                    ? [{ archivedTransactionId, liveTransactionId }]
                    : [];
            });
            const transactions = new Map(
                (yield* transactionRepository.findByIds(pairs.flatMap(pair => [pair.archivedTransactionId, pair.liveTransactionId]))).map(
                    transaction => [transaction.id, transaction]
                )
            );
            const duplicateIds = yield* Effect.forEach(pairs, ({ archivedTransactionId, liveTransactionId }) =>
                Effect.gen(function* () {
                    if (yield* isDeletableOneSidedRow(transactions.get(archivedTransactionId), archivedAccountId)) {
                        return archivedTransactionId;
                    }

                    return (yield* isDeletableOneSidedRow(transactions.get(liveTransactionId), liveAccountId)) ? liveTransactionId : null;
                })
            );

            return duplicateIds.filter(isDefined);
        });

        const findImportedTransferLegDuplicates = Effect.fnUntraced(function* (
            liveAccountId: number,
            archivedAccountId: number,
            externalSource: ExternalSourceEnum,
            supersededTransactionIds: ReadonlySet<number>
        ) {
            if (externalSource !== ExternalSourceEnum.PRIVATBANK) {
                return [];
            }

            const legs = yield* transactionRepository.findUnconsolidatedTransferLegs(archivedAccountId, externalSource);
            const transactions = yield* transactionRepository.findByAccountIdsWithEntries([liveAccountId, archivedAccountId]);
            const candidates = transactions.flatMap(transaction => {
                const isIncome = transaction.type === TransactionTypeEnum.INCOME;
                const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
                const entry = transaction.entries.find(
                    item => [liveAccountId, archivedAccountId].includes(item.accountId) && item.type === entryType
                );
                const isImportedRow =
                    (isIncome || transaction.type === TransactionTypeEnum.EXPENSE) &&
                    transaction.externalSource === externalSource &&
                    !isDefined(transaction.consolidationType) &&
                    !supersededTransactionIds.has(transaction.id);

                return isImportedRow && isDefined(entry)
                    ? [
                          {
                              transactionId: transaction.id,
                              externalIds: [transaction.externalId].filter(isDefined),
                              title: transaction.title,
                              isIncome,
                              isKnown: entry.accountId === archivedAccountId,
                              operatedAt: transaction.operatedAt,
                              amount: entry.amount
                          }
                      ]
                    : [];
            });

            return [...matchUnconsolidatedTransferLegs(candidates, legs, isPrivatbankOwnCardTransferTitle)];
        });

        const dropReplacedSyncAdjustments = Effect.fnUntraced(function* (liveAccountId: number, archivedAccountId: number) {
            const [liveSync, archivedSync] = yield* Effect.all([
                syncRepository.getByAccountId(liveAccountId),
                syncRepository.getByAccountId(archivedAccountId)
            ]);
            if (!isDefined(liveSync) || !isDefined(archivedSync)) {
                return;
            }

            yield* Effect.forEach(
                [archivedSync.balanceAdjustmentTransactionId, archivedSync.reconciliationTransactionId].filter(isDefined),
                transactionId => transactionService.purgeById(transactionId),
                { discard: true }
            );
        });

        const mergeArchivedDuplicate = Effect.fnUntraced(
            function* (candidate: ArchivedAccountDuplicateCandidateInterface) {
                const { archivedAccountId, externalSource, liveAccountId } = candidate;

                yield* accountArchiveService.restoreById(archivedAccountId);

                const sharedExternalIdDuplicateIds = yield* findSharedExternalIdDuplicateIds(
                    liveAccountId,
                    archivedAccountId,
                    externalSource
                );
                const legDuplicates = yield* findImportedTransferLegDuplicates(
                    liveAccountId,
                    archivedAccountId,
                    externalSource,
                    new Set(sharedExternalIdDuplicateIds)
                );

                yield* Effect.forEach(
                    [...sharedExternalIdDuplicateIds, ...legDuplicates.map(([{ transactionId }]) => transactionId)],
                    transactionId => transactionService.deleteById(transactionId),
                    { discard: true }
                );
                yield* Effect.forEach(
                    legDuplicates.flatMap(([{ externalIds }, leg]) => {
                        const [externalId] = externalIds;

                        return isDefined(externalId) && !isDefined(leg.entryExternalId) ? [{ externalId, leg }] : [];
                    }),
                    ({ externalId, leg }) => transactionEntryRepository.updateById(leg.entryId, { externalId }),
                    { discard: true }
                );
                yield* dropReplacedSyncAdjustments(liveAccountId, archivedAccountId);
                yield* reassignReferences(archivedAccountId, liveAccountId);
                yield* accountRepository.deleteById(liveAccountId);
                yield* accountRepository.updateById(archivedAccountId, {
                    integrationId: candidate.integrationId,
                    isActive: candidate.isActive === 1
                });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([archivedAccountId]);
            },
            effect => Db.transaction(effect)
        );

        const findArchivedDuplicates = Db.query(db => db.$client.unsafe<ArchivedAccountDuplicateCandidateInterface>(archivedDuplicatesSql));

        const findUnambiguousCandidates = Effect.fnUntraced(function* () {
            const candidates = yield* Db.query(db => db.$client.unsafe<AccountReissueCandidateInterface>(candidatesSql));
            const isUnambiguous = (candidate: AccountReissueCandidateInterface): boolean =>
                candidates.filter(other => other.successorAccountId === candidate.successorAccountId).length === 1 &&
                !candidates.some(
                    other =>
                        other.predecessorAccountId === candidate.predecessorAccountId &&
                        other.successorAccountId !== candidate.successorAccountId &&
                        other.successorFirstAt <= candidate.successorLastAt &&
                        candidate.successorFirstAt <= other.successorLastAt
                );

            return candidates.filter(isUnambiguous);
        });

        const mergeCandidate = Effect.fnUntraced(
            function* (candidate: AccountReissueCandidateInterface) {
                const { predecessorAccountId, successorAccountId } = candidate;
                const mergedTitle = resolveMergedTitle(candidate);

                yield* reassignReferences(predecessorAccountId, successorAccountId);
                yield* accountRepository.deleteById(successorAccountId);

                if (isDefined(candidate.predecessorExternalId) && candidate.predecessorExternalId !== candidate.externalId) {
                    yield* accountRepository.addExternalIdAlias(candidate.predecessorExternalId, predecessorAccountId);
                }

                yield* accountRepository.updateById(predecessorAccountId, {
                    externalId: candidate.externalId,
                    iban: candidate.iban,
                    integrationId: candidate.integrationId,
                    isActive: candidate.isActive === 1,
                    ...(isDefined(mergedTitle) && { title: mergedTitle })
                });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([predecessorAccountId]);
            },
            effect => Db.transaction(effect)
        );

        return {
            countCandidates: Effect.map(findUnambiguousCandidates(), candidates => candidates.length),
            countArchivedDuplicates: Effect.map(findArchivedDuplicates, archivedDuplicates => archivedDuplicates.length),
            mergeArchivedDuplicates: Effect.fn('AccountReissueMergeService.mergeArchivedDuplicates')(function* () {
                const archivedDuplicates = yield* findArchivedDuplicates;
                yield* Effect.forEach(archivedDuplicates, mergeArchivedDuplicate, { discard: true });

                return archivedDuplicates.length;
            }),
            mergeReissuedAccounts: Effect.fn('AccountReissueMergeService.mergeReissuedAccounts')(function* () {
                let mergedCount = 0;
                let [candidate] = yield* findUnambiguousCandidates();

                while (isDefined(candidate)) {
                    yield* mergeCandidate(candidate);
                    mergedCount += 1;
                    [candidate] = yield* findUnambiguousCandidates();
                }

                return mergedCount;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AccountReissueMergeService, AccountReissueMergeService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            AccountBalanceIncrementalService.layer,
            AccountArchiveService.layer,
            TransactionRepository.layer,
            TransactionEntryRepository.layer,
            SyncRepository.layer,
            TransactionService.layer
        ])
    );
}
