import { AccountRepository, Db, ExternalSourceEnum } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { PRIVATBANK_CARD_REISSUE_EVIDENCE_SQL } from '../../privatbank/constant/privatbank-card-reissue-evidence-sql.constant';

import type { AccountReissueCandidateInterface } from '../interface/account-reissue-candidate.interface';

export class AccountReissueMergeService extends Context.Service<AccountReissueMergeService>()('@budgie/sync/AccountReissueMergeService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

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

        const reassignReferencesSql = [
            'UPDATE transactions SET from_account_id = ? WHERE from_account_id = ?',
            'UPDATE transactions SET to_account_id = ? WHERE to_account_id = ?',
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

                yield* Db.mutation(
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
                            'account_balances'
                        ]
                    },
                    Effect.forEach(
                        reassignReferencesSql,
                        statement => Db.query(db => db.$client.unsafe(statement, [predecessorAccountId, successorAccountId]).raw),
                        { discard: true }
                    )
                );
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
            countCandidates: () => Effect.map(findUnambiguousCandidates(), candidates => candidates.length),
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
        Layer.provide([AccountRepository.layer, AccountBalanceIncrementalService.layer])
    );
}
