import { TransferConsolidationBankFlow } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { InzhurBankFlowService } from '../../inzhur/service/inzhur-bank-flow.service';
import { BankInterestDetectorService } from '../service/bank-interest-detector.service';
import { OwnTransferRepairService } from '../service/own-transfer-repair.service';

export const transferConsolidationBankFlowLayer = Layer.effect(
    TransferConsolidationBankFlow,
    Effect.gen(function* () {
        const inzhurBankFlowService = yield* InzhurBankFlowService;
        const bankInterestDetectorService = yield* BankInterestDetectorService;
        const ownTransferRepairService = yield* OwnTransferRepairService;

        return TransferConsolidationBankFlow.of({
            prepare: scope => inzhurBankFlowService.apply(scope).pipe(Effect.andThen(bankInterestDetectorService.tag(scope))),
            repair: scope => Effect.asVoid(ownTransferRepairService.repair(scope))
        });
    })
).pipe(Layer.provide([InzhurBankFlowService.layer, BankInterestDetectorService.layer, OwnTransferRepairService.layer]));
