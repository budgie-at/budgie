import { ExternalSourceEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { INZHUR_PAIRING_WINDOW_MILLISECONDS } from '../constant/inzhur-pairing-window.constant';
import { parseInzhurOperationExternalId } from '../utils/parse-inzhur-operation-external-id.util';

import type { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

export class InzhurCashPairingService extends Context.Service<InzhurCashPairingService>()('@budgie/sync/InzhurCashPairingService', {
    make: Effect.gen(function* () {
        const transactionService = yield* TransactionService;

        return {
            findPlaceholderId: Effect.fn('InzhurCashPairingService.findPlaceholderId')(function* (
                cashAccountId: number,
                kind: InzhurOperationKindEnum,
                amountMicroUnits: number,
                operatedAt: Date
            ) {
                const idByExternalId = yield* transactionService.findIdMapByExternalSource(ExternalSourceEnum.INZHUR, [cashAccountId]);
                const candidates = [...idByExternalId]
                    .map(([externalId, id]) => ({ id, parsed: parseInzhurOperationExternalId(externalId) }))
                    .flatMap(({ id, parsed }) =>
                        isDefined(parsed) && parsed.kind === kind && parsed.amountMicroUnits === amountMicroUnits
                            ? [{ id, distance: Math.abs(parsed.occurredAt.getTime() - operatedAt.getTime()) }]
                            : []
                    )
                    .filter(({ distance }) => distance <= INZHUR_PAIRING_WINDOW_MILLISECONDS)
                    .sort((left, right) => left.distance - right.distance);

                return candidates.at(0)?.id ?? null;
            }),
            release: (placeholderId: number) => transactionService.deleteById(placeholderId)
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurCashPairingService, InzhurCashPairingService.make).pipe(
        Layer.provide([TransactionService.layer])
    );
}
