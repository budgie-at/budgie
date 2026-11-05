import {
    AccountRepository,
    AccountTypeEnum,
    BankIntegrationRepository,
    Db,
    ExternalSourceEnum,
    InstrumentRepository,
    normalizeAccountIban,
    SyncModeEnum,
    SyncRepository,
    SyncStatusEnum,
    TransactionRepository
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LIVE_SYNC_PROVIDERS } from '../constant/live-sync-providers.constant';
import { SyncAccountContinuationRefusalEnum } from '../enum/sync-account-continuation-refusal.enum';
import { SyncAccountContinuationRefusedError } from '../error/sync-account-continuation-refused.error';
import { SyncIntegrationTokenService } from '../service/sync-integration-token.service';

import { isLiveSync } from './is-live-sync.util';
import { resolveMatchableIban } from './resolve-matchable-iban.util';

import type { SyncAccountContinuationChoicesInterface } from '../interface/sync-account-continuation-choices.interface';
import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

export const makePollingSyncAccountContinuation = Effect.fnUntraced(function* (provider: ExternalSourceEnum) {
    const accountRepository = yield* AccountRepository;
    const bankIntegrationRepository = yield* BankIntegrationRepository;
    const instrumentRepository = yield* InstrumentRepository;
    const syncRepository = yield* SyncRepository;
    const transactionRepository = yield* TransactionRepository;
    const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const returnableProviders = new Set([...LIVE_SYNC_PROVIDERS, ExternalSourceEnum.ERSTE, ExternalSourceEnum.PRIVATBANK]);
    const clearedSyncProblems = { status: SyncStatusEnum.IDLE, errorCount: 0, lastError: null, lastErrorCode: null, lastWarning: null };

    const requireAccount = (accountId: number) =>
        Effect.filterOrElse(accountRepository.findById(accountId), isDefined, () => Effect.die(new Error('Account to connect not found')));

    const findKeysLinkedElsewhere = Effect.fnUntraced(function* (accountId: number, externalIds: string[], ibans: string[]) {
        const [byExternalId, aliases, byIban] = yield* Effect.all([
            accountRepository.findByExternalIds(externalIds),
            accountRepository.findExternalIdAliases(externalIds),
            accountRepository.findByIbans(ibans)
        ]);

        return new Set([
            ...byExternalId.filter(other => other.id !== accountId).map(other => other.externalId),
            ...aliases.filter(({ account }) => account.id !== accountId && !isDefined(account.deletedAt)).map(alias => alias.externalId),
            ...byIban.filter(other => other.id !== accountId).map(other => other.iban)
        ]);
    });

    const findChoices = Effect.fnUntraced(function* (accountId: number, bankAccounts: readonly SyncAccountInterface[]) {
        const account = yield* requireAccount(accountId);
        const accountIban = resolveMatchableIban(normalizeAccountIban(account.iban));
        const sync = yield* syncRepository.getByAccountId(accountId);
        const instrumentCode = (yield* instrumentRepository.findById(account.instrumentId))?.code;
        const keysElsewhere = yield* findKeysLinkedElsewhere(
            accountId,
            bankAccounts.map(bankAccount => bankAccount.id),
            bankAccounts.map(bankAccount => resolveMatchableIban(bankAccount.iban)).filter(isDefined)
        );

        const findRefusal = ({ id, iban, currencyCode }: SyncAccountInterface) => {
            const matchableIban = resolveMatchableIban(iban);

            return (
                [
                    { isRefused: isDefined(sync) && isLiveSync(sync), reason: SyncAccountContinuationRefusalEnum.LIVE_SYNC },
                    { isRefused: currencyCode !== instrumentCode, reason: SyncAccountContinuationRefusalEnum.CURRENCY_MISMATCH },
                    {
                        isRefused: isDefined(accountIban) && isDefined(matchableIban) && accountIban !== matchableIban,
                        reason: SyncAccountContinuationRefusalEnum.IBAN_MISMATCH
                    },
                    {
                        isRefused: keysElsewhere.has(id) || (isDefined(matchableIban) && keysElsewhere.has(matchableIban)),
                        reason: SyncAccountContinuationRefusalEnum.LINKED_ELSEWHERE
                    }
                ].find(check => check.isRefused)?.reason ?? null
            );
        };

        const refusals = new Map(
            bankAccounts.flatMap(bankAccount => {
                const refusal = findRefusal(bankAccount);

                return isDefined(refusal) ? [[bankAccount.id, refusal] as const] : [];
            })
        );
        const fitting = bankAccounts.filter(bankAccount => !refusals.has(bankAccount.id));
        const ibanMatch = fitting.find(bankAccount => isDefined(accountIban) && resolveMatchableIban(bankAccount.iban) === accountIban);

        return {
            accountId,
            refusals,
            suggestedExternalId: ibanMatch?.id ?? (fitting.length === 1 ? fitting[0].id : null)
        } satisfies SyncAccountContinuationChoicesInterface;
    });

    const moveSyncToProvider = Effect.fnUntraced(function* (accountId: number, lastRowAt: Date | null) {
        const now = new Date();
        const startAt = isDefined(lastRowAt)
            ? new Date(lastRowAt.getTime() - (lastRowAt.getTime() % millisecondsPerDay) + millisecondsPerDay)
            : null;
        const values = {
            ...clearedSyncProblems,
            provider,
            enabled: true,
            forwardSyncedAt: null,
            setupBalance: null,
            backwardSyncLimitAt: startAt,
            forwardSyncFromAt: startAt ?? now,
            mode: isDefined(startAt) ? SyncModeEnum.FORWARD : SyncModeEnum.BACKWARD,
            ...(!isDefined(startAt) && { backwardSyncFromAt: now, backwardSyncedAt: null })
        };
        const sync = yield* syncRepository.getByAccountId(accountId);
        yield* isDefined(sync) ? syncRepository.update(sync.id, values) : syncRepository.create({ accountId, ...values });

        return startAt;
    });

    const connectWork = Effect.fnUntraced(function* (account: AccountEntityInterface, token: string, bankAccount: SyncAccountInterface) {
        if (isDefined(account.externalId) && account.externalId !== bankAccount.id) {
            yield* accountRepository.addExternalIdAlias(account.externalId, account.id);
        }

        const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
        yield* accountRepository.updateById(account.id, {
            type: AccountTypeEnum.BANK_SYNC,
            externalId: bankAccount.id,
            externalSource: provider,
            integrationId: integration.id,
            iban: account.iban ?? resolveMatchableIban(bankAccount.iban),
            isActive: true
        });
        if (isDefined(account.integrationId) && account.integrationId !== integration.id) {
            yield* bankIntegrationRepository.deleteIfUnreferenced(account.integrationId);
        }

        return yield* moveSyncToProvider(account.id, yield* transactionRepository.getTransactionTimeByAccountId(account.id, 'latest'));
    });

    const releaseToProvider = Effect.fnUntraced(function* (account: AccountEntityInterface, previousProvider: ExternalSourceEnum) {
        const previousExternalId = yield* accountRepository.findLatestExternalIdAlias(account.id, account.externalId);
        if (isDefined(previousExternalId)) {
            yield* accountRepository.removeExternalIdAlias(previousExternalId);
        }

        const sync = yield* syncRepository.getByAccountId(account.id);
        if (isDefined(sync)) {
            yield* syncRepository.update(sync.id, {
                ...clearedSyncProblems,
                provider: previousProvider,
                enabled: !LIVE_SYNC_PROVIDERS.has(previousProvider),
                mode: SyncModeEnum.FORWARD,
                forwardSyncFromAt: new Date(),
                reconciledAt: null,
                reconciledBalance: null,
                reconciliationTransactionId: null
            });
        }
        yield* accountRepository.updateById(account.id, {
            externalId: previousExternalId,
            externalSource: previousProvider,
            integrationId: null
        });
    });

    const releaseToManual = Effect.fnUntraced(function* (accountId: number) {
        yield* syncRepository.deleteByAccountId(accountId);
        yield* accountRepository.updateById(accountId, {
            type: AccountTypeEnum.BANK,
            externalId: null,
            externalSource: null,
            integrationId: null
        });
    });

    return {
        findChoices,
        connect: Effect.fnUntraced(function* (accountId: number, token: string, bankAccount: SyncAccountInterface) {
            const refusal = (yield* findChoices(accountId, [bankAccount])).refusals.get(bankAccount.id);
            if (isDefined(refusal)) {
                return yield* new SyncAccountContinuationRefusedError({
                    accountId,
                    reason: refusal,
                    message: 'This bank account cannot continue this Budgie account'
                });
            }

            return yield* Db.transaction(connectWork(yield* requireAccount(accountId), token, bankAccount));
        }),
        release: Effect.fnUntraced(function* (account: AccountEntityInterface) {
            const foreignSources = (yield* transactionRepository.findExternalSourcesByAccountId(account.id)).filter(
                source => source.externalSource !== provider
            );
            if (!isNotEmptyArray(foreignSources)) {
                return false;
            }

            const previousProvider = foreignSources
                .filter(source => isDefined(source.externalSource) && returnableProviders.has(source.externalSource))
                .sort((left, right) => right.lastOperatedAt - left.lastOperatedAt)
                .at(0)?.externalSource;

            yield* Db.transaction(
                Effect.gen(function* () {
                    yield* isDefined(previousProvider) ? releaseToProvider(account, previousProvider) : releaseToManual(account.id);
                    if (isDefined(account.externalId)) {
                        yield* accountRepository.addExternalIdAlias(account.externalId, account.id);
                    }
                })
            );

            return true;
        })
    };
});
