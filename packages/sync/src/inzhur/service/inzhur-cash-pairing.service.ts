import { ExternalSourceEnum, TransactionEntryRepository, TransactionRepository } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '../constant/inzhur-operation-external-id-prefix.constant';
import { INZHUR_PAIRING_WINDOW_MILLISECONDS } from '../constant/inzhur-pairing-window.constant';
import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export class InzhurCashPairingService extends Context.Service<InzhurCashPairingService>()('@budgie/sync/InzhurCashPairingService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionService = yield* TransactionService;

        const parseInzhurOperationExternalId = (externalId: string) => {
            if (!externalId.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX)) {
                return null;
            }

            const [seconds, rawKind, , amountMicroUnits] = externalId.slice(INZHUR_OPERATION_EXTERNAL_ID_PREFIX.length).split(':');
            const kind = Object.entries(InzhurOperationKindEnum).find(([name]) => name === rawKind)?.[1];

            return isDefined(kind)
                ? { occurredAt: new Date(Number(seconds) * 1000), kind, amountMicroUnits: Number(amountMicroUnits) }
                : null;
        };

        return {
            findPlaceholder: Effect.fn('InzhurCashPairingService.findPlaceholder')(function* (
                cashAccountId: number,
                kind: InzhurOperationKindEnum,
                amountMicroUnits: number,
                operatedAt: Date
            ) {
                const idByExternalId = yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.INZHUR, [cashAccountId]);
                const candidates = [...idByExternalId]
                    .map(([externalId, id]) => ({ id, externalId, parsed: parseInzhurOperationExternalId(externalId) }))
                    .flatMap(({ id, externalId, parsed }) =>
                        isDefined(parsed) && parsed.kind === kind && parsed.amountMicroUnits === amountMicroUnits
                            ? [{ id, externalId, distance: Math.abs(parsed.occurredAt.getTime() - operatedAt.getTime()) }]
                            : []
                    )
                    .filter(({ distance }) => distance <= INZHUR_PAIRING_WINDOW_MILLISECONDS)
                    .sort((left, right) => left.distance - right.distance);

                const nearest = candidates.at(0);

                return isDefined(nearest) ? { id: nearest.id, externalId: nearest.externalId } : null;
            }),
            release: (placeholderId: number) => transactionService.deleteById(placeholderId),
            stamp: Effect.fn('InzhurCashPairingService.stamp')(function* (
                transactionId: number,
                cashAccountId: number,
                operationExternalId: string
            ) {
                const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);
                const cashEntry = transaction?.entries.find(entry => entry.accountId === cashAccountId);

                if (isDefined(cashEntry)) {
                    yield* transactionEntryRepository.updateById(cashEntry.id, { externalId: operationExternalId });
                }
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurCashPairingService, InzhurCashPairingService.make).pipe(
        Layer.provide([TransactionEntryRepository.layer, TransactionRepository.layer, TransactionService.layer])
    );
}
