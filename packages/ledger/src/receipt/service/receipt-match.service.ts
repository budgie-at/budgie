import {
    AccountRepository,
    AccountTypeEnum,
    Db,
    type ReceiptMatchCandidateInterface,
    TransactionReceiptRepository,
    TransactionRepository
} from '@budgie/contracts';
import { addDays, subDays } from 'date-fns';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ReceiptMatchResultKindEnum } from '../enum/receipt-match-result-kind.enum';

import type { ReceiptMatchInputInterface } from '../interface/receipt-match-input.interface';

export class ReceiptMatchService extends Context.Service<ReceiptMatchService>()('@budgie/ledger/ReceiptMatchService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionReceiptRepository = yield* TransactionReceiptRepository;
        const transactionRepository = yield* TransactionRepository;

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

        const toCardExternalId = (input: ReceiptMatchInputInterface) =>
            isNotEmptyString(input.cardLast4) ? `${CARD_EXTERNAL_ID_PREFIX}${input.cardLast4}` : null;

        return {
            propose: Effect.fn('ReceiptMatchService.propose')(function* (input: ReceiptMatchInputInterface) {
                yield* transactionReceiptRepository.deleteForDeletedTransaction(input.fingerprint);

                const existing = yield* transactionReceiptRepository.findByFingerprint(input.fingerprint);

                if (isDefined(existing)) {
                    return { kind: ReceiptMatchResultKindEnum.DUPLICATE, transactionId: existing.transactionId, accountId: null };
                }

                const cardExternalId = toCardExternalId(input);
                const candidates = yield* transactionReceiptRepository.findMatchCandidates({
                    total: input.total,
                    currency: input.currency,
                    from: subDays(input.occurredAt, WINDOW_DAYS_BEFORE),
                    to: addDays(input.occurredAt, WINDOW_DAYS_AFTER),
                    cardExternalId
                });
                const candidate = pickCandidate(candidates, input);

                if (isDefined(candidate)) {
                    return { kind: ReceiptMatchResultKindEnum.MATCHED, transactionId: candidate.transactionId, accountId: null };
                }

                return {
                    kind: ReceiptMatchResultKindEnum.NEW,
                    transactionId: null,
                    accountId: yield* transactionReceiptRepository.findExpenseAccountId(input.currency, cardExternalId)
                };
            }),
            attach: Effect.fn('ReceiptMatchService.attach')(
                function* (transactionId: number, input: ReceiptMatchInputInterface) {
                    const existing = yield* transactionReceiptRepository.findByFingerprint(input.fingerprint);

                    if (isDefined(existing)) {
                        return;
                    }

                    yield* insertReceipt(transactionId, input);

                    const cardExternalId = toCardExternalId(input);
                    const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);
                    const account = isDefined(transaction?.fromAccountId)
                        ? yield* accountRepository.findById(transaction.fromAccountId)
                        : null;

                    if (isDefined(cardExternalId) && isDefined(account) && account.type !== AccountTypeEnum.CASH) {
                        yield* learnCardAccount(cardExternalId, account.id);
                    }
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(ReceiptMatchService, ReceiptMatchService.make).pipe(
        Layer.provide([AccountRepository.layer, TransactionReceiptRepository.layer, TransactionRepository.layer])
    );
}
