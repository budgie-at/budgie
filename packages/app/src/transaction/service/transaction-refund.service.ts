import { RefundConsolidationService } from '@budgie/consolidation';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export class TransactionRefundService extends Context.Service<TransactionRefundService>()('@budgie/app/TransactionRefundService', {
    make: Effect.gen(function* () {
        return yield* RefundConsolidationService;
    })
}) {
    static readonly layer = Layer.effect(TransactionRefundService, TransactionRefundService.make).pipe(
        Layer.provide(RefundConsolidationService.layer)
    );
}
