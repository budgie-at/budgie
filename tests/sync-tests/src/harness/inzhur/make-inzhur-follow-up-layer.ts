import { buildInzhurBaselineItems, buildInzhurHoldings } from './build-inzhur-baseline-items';
import { buildInzhurStatementItems } from './build-inzhur-statement-items';
import { FIRST_URI, SECOND_DATE, SECOND_URI } from './inzhur-statement-fixtures.constant';
import { makeInzhurLayer } from './make-inzhur-layer';

export const makeInzhurFollowUpLayer = (reitQuantity: number, energyQuantity: number) =>
    makeInzhurLayer({
        [FIRST_URI]: buildInzhurBaselineItems(1000, 2),
        [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(reitQuantity, energyQuantity))
    });
