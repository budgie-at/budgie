import { InzhurGainService } from '@budgie/sync';
import * as Layer from 'effect/Layer';

import { buildInzhurBaselineItems, buildInzhurHoldings } from './build-inzhur-baseline-items';
import { buildInzhurStatementItems } from './build-inzhur-statement-items';
import { inzhurLedgerWorkloadLayer } from './inzhur-ledger-workload.layer';
import { FIRST_URI, SECOND_DATE, SECOND_URI } from './inzhur-statement-fixtures.constant';
import { makeInzhurLayer } from './make-inzhur-layer';

export const makeInzhurGainLayer = (reitQuantity: number, energyQuantity: number) =>
    Layer.provideMerge(
        InzhurGainService.layer.pipe(Layer.provide(inzhurLedgerWorkloadLayer)),
        makeInzhurLayer({
            [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
            [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(reitQuantity, energyQuantity))
        })
    );
