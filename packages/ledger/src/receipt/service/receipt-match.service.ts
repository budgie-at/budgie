import {
    AccountRepository,
    CategorySourceEnum,
    convertFromMicroUnits,
    Db,
    ExternalSourceEnum,
    type ReceiptMatchCandidateInterface,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionReceiptRepository,
    TransactionRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { addDays, subDays } from 'date-fns';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { TransactionService } from '../../transaction/service/transaction.service';
import { createTransactionInput } from '../../transaction/utils/create-transaction-input.util';
import { ReceiptMatchResultKindEnum } from '../enum/receipt-match-result-kind.enum';
import { ReceiptAccountNotFoundError } from '../error/receipt-account-not-found.error';

import type { ReceiptMatchInputInterface } from '../interface/receipt-match-input.interface';

export class ReceiptMatchService extends Context.Service<ReceiptMatchService>()('@budgie/ledger/ReceiptMatchService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionReceiptRepository = yield* TransactionReceiptRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionService = yield* TransactionService;

        const CARD_EXTERNAL_ID_PREFIX = 'receipt-card:';
        const WINDOW_DAYS_BEFORE = 1;
        const WINDOW_DAYS_AFTER = 5;

        const tokenize = (text: string): Set<string> =>
            new Set(
                text
                    .toLowerCase()
                    .split(/[^\p{L}\p{N}]+/u)
                    .filter(token => token.length > 1)
            );

        const measureSimilarity = (merchants: readonly string[], title: string): number => {
            const titleTokens = tokenize(title);

            return Math.max(
                0,
                ...merchants.map(merchant => {
                    const merchantTokens = [...tokenize(merchant)];
                    const sharedCount = merchantTokens.filter(token => titleTokens.has(token)).length;
                    const unionCount = new Set([...merchantTokens, ...titleTokens]).size;

                    return unionCount > 0 ? sharedCount / unionCount : 0;
                })
            );
        };

        const rankKeys = (candidate: ReceiptMatchCandidateInterface, input: ReceiptMatchInputInterface): readonly number[] => [
            candidate.isCardMatch ? 1 : 0,
            measureSimilarity([input.title, ...input.merchantCandidates], candidate.title),
            -Math.abs(candidate.operatedAt.getTime() - input.occurredAt.getTime()),
            -candidate.transactionId
        ];

        const compareKeys = (left: readonly number[], right: readonly number[]): number =>
            left.reduce((result, value, index) => (result === 0 ? right[index] - value : result), 0);

        const pickCandidate = (candidates: readonly ReceiptMatchCandidateInterface[], input: ReceiptMatchInputInterface) =>
            candidates
                .map(candidate => ({ candidate, keys: rankKeys(candidate, input) }))
                .sort((left, right) => compareKeys(left.keys, right.keys))
                .at(0)?.candidate ?? null;

        const learnCardAccount = Effect.fnUntraced(function* (cardExternalId: string, accountId: number) {
            const aliases = yield* accountRepository.findExternalIdAliases([cardExternalId]);

            if (!isNotEmptyArray(aliases)) {
                yield* accountRepository.addExternalIdAlias(cardExternalId, accountId);
            }
        });

        const insertReceipt = (transactionId: number, input: ReceiptMatchInputInterface) =>
            transactionReceiptRepository.insert({
                transactionId,
                fingerprint: input.fingerprint,
                receiptNumber: input.receiptNumber,
                merchantVatId: input.merchantVatId,
                merchantLegalName: input.merchantLegalName
            });

        const applyMatch = Effect.fnUntraced(function* (
            candidate: ReceiptMatchCandidateInterface,
            input: ReceiptMatchInputInterface,
            cardExternalId: string | null
        ) {
            const shouldSetTitle = !isDefined(candidate.updatedBy) && isNotEmptyString(input.title);
            const shouldSetComment = !isNotEmptyString(candidate.comment) && isNotEmptyString(input.description);

            if (shouldSetTitle || shouldSetComment) {
                yield* transactionRepository.updateById(candidate.transactionId, {
                    ...(shouldSetTitle && { title: input.title }),
                    ...(shouldSetComment && { comment: input.description })
                });
            }

            if (!isDefined(candidate.categoryId) && isDefined(input.categoryId)) {
                yield* transactionEntryRepository.updateById(candidate.entryId, {
                    categoryId: input.categoryId,
                    categorySource: CategorySourceEnum.AI
                });
            }

            if (isDefined(cardExternalId)) {
                yield* learnCardAccount(cardExternalId, candidate.accountId);
            }

            yield* insertReceipt(candidate.transactionId, input);

            return { kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: candidate.transactionId };
        });

        const createExpense = Effect.fnUntraced(function* (input: ReceiptMatchInputInterface, cardExternalId: string | null) {
            const accountId = yield* transactionReceiptRepository.findExpenseAccountId(input.currency, cardExternalId);

            if (!isDefined(accountId)) {
                return yield* new ReceiptAccountNotFoundError({ currency: input.currency });
            }

            const amount = convertFromMicroUnits(input.total);
            const transaction = yield* transactionService.createInternal({
                ...createTransactionInput({
                    type: TransactionTypeEnum.EXPENSE,
                    fromAccountId: accountId,
                    toAccountId: null,
                    exchangeRate: 1,
                    amount,
                    comment: input.description ?? '',
                    entries: [
                        {
                            accountId,
                            categoryId: input.categoryId,
                            ...(isDefined(input.categoryId) && { categorySource: CategorySourceEnum.AI }),
                            mccCategoryId: null,
                            type: TransactionEntryTypeEnum.CREDIT,
                            kind: TransactionEntryKindEnum.PRIMARY,
                            amount,
                            externalId: null
                        }
                    ]
                }),
                title: input.title,
                operatedAt: input.occurredAt,
                externalId: input.fingerprint,
                externalSource: ExternalSourceEnum.RECEIPT
            });

            yield* insertReceipt(transaction.id, input);

            return { kind: ReceiptMatchResultKindEnum.CREATED, transactionId: transaction.id };
        });

        return {
            match: Effect.fn('ReceiptMatchService.match')(
                function* (input: ReceiptMatchInputInterface) {
                    const existing = yield* transactionReceiptRepository.findByFingerprint(input.fingerprint);

                    if (isDefined(existing)) {
                        return { kind: ReceiptMatchResultKindEnum.DUPLICATE, transactionId: existing.transactionId };
                    }

                    const cardExternalId = isNotEmptyString(input.cardLast4) ? `${CARD_EXTERNAL_ID_PREFIX}${input.cardLast4}` : null;
                    const candidates = yield* transactionReceiptRepository.findMatchCandidates({
                        total: input.total,
                        currency: input.currency,
                        from: subDays(input.occurredAt, WINDOW_DAYS_BEFORE),
                        to: addDays(input.occurredAt, WINDOW_DAYS_AFTER),
                        cardExternalId
                    });
                    const candidate = pickCandidate(candidates, input);

                    return isDefined(candidate)
                        ? yield* applyMatch(candidate, input, cardExternalId)
                        : yield* createExpense(input, cardExternalId);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(ReceiptMatchService, ReceiptMatchService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            TransactionEntryRepository.layer,
            TransactionReceiptRepository.layer,
            TransactionRepository.layer,
            TransactionService.layer
        ])
    );
}
