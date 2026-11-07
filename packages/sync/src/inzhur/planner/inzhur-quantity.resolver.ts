import { convertToMicroUnits } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

import type { InzhurPlannedActionInterface } from '../interface/inzhur-planned-action.interface';
import type { InzhurQuantityResolutionInputInterface } from '../interface/inzhur-quantity-resolution-input.interface';
import type { InzhurResolvedQuantityInterface } from '../interface/inzhur-resolved-quantity.interface';

class InzhurQuantityResolver {
    resolve(input: InzhurQuantityResolutionInputInterface): ReadonlyMap<string, InzhurResolvedQuantityInterface> {
        const trades = input.actions.filter(action => this.isTrade(action));
        const unknownBuys = trades.filter(action => action.kind === InzhurOperationKindEnum.BUY && !isDefined(action.quantity));
        const resolved = new Map<string, InzhurResolvedQuantityInterface>();

        for (const action of unknownBuys) {
            const stored = input.storedMicroUnitsByExternalId.get(action.externalId);
            const estimate = isDefined(stored) ? { microUnits: stored, isEstimated: true } : this.estimate(action, input.priceByExternalId);

            if (isDefined(estimate)) {
                resolved.set(action.externalId, estimate);
            }
        }

        this.resolveInOrder(resolved, trades, input);

        return resolved;
    }

    private isTrade(action: InzhurPlannedActionInterface): boolean {
        return action.kind === InzhurOperationKindEnum.BUY || action.kind === InzhurOperationKindEnum.SELL;
    }

    private resolveInOrder(
        resolved: Map<string, InzhurResolvedQuantityInterface>,
        trades: readonly InzhurPlannedActionInterface[],
        input: InzhurQuantityResolutionInputInterface
    ): void {
        const running = new Map(input.baseMicroUnitsByFund);

        for (const action of trades) {
            const fundName = action.fundName ?? '';
            const held = running.get(fundName) ?? 0;
            const quantity = this.resolveTrade(action, held, resolved, input.priceByExternalId);

            if (isDefined(quantity)) {
                resolved.set(action.externalId, quantity);
                running.set(fundName, held + (action.kind === InzhurOperationKindEnum.BUY ? quantity.microUnits : -quantity.microUnits));
            }
        }
    }

    private resolveTrade(
        action: InzhurPlannedActionInterface,
        heldMicroUnits: number,
        resolved: ReadonlyMap<string, InzhurResolvedQuantityInterface>,
        priceByExternalId: ReadonlyMap<string, number>
    ): InzhurResolvedQuantityInterface | null {
        if (isDefined(action.quantity)) {
            return { microUnits: convertToMicroUnits(action.quantity), isEstimated: false };
        }

        if (!action.isSellAll) {
            return resolved.get(action.externalId) ?? null;
        }

        return isPositiveNumber(heldMicroUnits)
            ? { microUnits: heldMicroUnits, isEstimated: false }
            : this.estimate(action, priceByExternalId);
    }

    private estimate(
        action: InzhurPlannedActionInterface,
        priceByExternalId: ReadonlyMap<string, number>
    ): InzhurResolvedQuantityInterface | null {
        const price = priceByExternalId.get(action.externalId);

        return isPositiveNumber(price)
            ? { microUnits: convertToMicroUnits(Math.round(action.cashAmount / price)), isEstimated: true }
            : null;
    }
}

export const inzhurQuantityResolver = new InzhurQuantityResolver();
