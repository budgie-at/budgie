import { convertToMicroUnits } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

import type { InzhurPlannedActionInterface } from '../interface/inzhur-planned-action.interface';
import type { InzhurQuantityResolutionInputInterface } from '../interface/inzhur-quantity-resolution-input.interface';
import type { InzhurResolvedQuantityInterface } from '../interface/inzhur-resolved-quantity.interface';

class InzhurQuantityResolver {
    resolve(input: InzhurQuantityResolutionInputInterface): ReadonlyMap<string, InzhurResolvedQuantityInterface> {
        const trades = input.actions.filter(action => this.isTrade(action));
        const unknownBuys = trades.filter(action => action.kind === InzhurOperationKindEnum.BUY && !isDefined(action.quantity));
        const resolved = new Map(this.fillFromStatement(input, trades, unknownBuys));

        for (const action of unknownBuys) {
            const estimate = resolved.has(action.externalId) ? null : this.estimate(action, input.priceByExternalId);

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

        return heldMicroUnits > 0 ? { microUnits: heldMicroUnits, isEstimated: false } : this.estimate(action, priceByExternalId);
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

    private knownAtCutoff(
        trades: readonly InzhurPlannedActionInterface[],
        baseMicroUnitsByFund: ReadonlyMap<string, number>,
        cutoff: Date
    ): Map<string, number> {
        const known = new Map(baseMicroUnitsByFund);

        for (const action of trades.filter(trade => trade.occurredAt < cutoff)) {
            const fundName = action.fundName ?? '';
            const held = known.get(fundName) ?? 0;

            if (action.isSellAll) {
                known.set(fundName, 0);
            } else if (isDefined(action.quantity)) {
                const delta = convertToMicroUnits(action.quantity);

                known.set(fundName, action.kind === InzhurOperationKindEnum.BUY ? held + delta : held - delta);
            }
        }

        return known;
    }

    private fillFromStatement(
        input: InzhurQuantityResolutionInputInterface,
        trades: readonly InzhurPlannedActionInterface[],
        unknownBuys: readonly InzhurPlannedActionInterface[]
    ): Map<string, InzhurResolvedQuantityInterface> {
        const filled = new Map<string, InzhurResolvedQuantityInterface>();
        const { statementCutoff, statementMicroUnitsByFund } = input;

        if (!isDefined(statementCutoff)) {
            return filled;
        }

        const known = this.knownAtCutoff(trades, input.baseMicroUnitsByFund, statementCutoff);

        for (const fundName of new Set(unknownBuys.flatMap(action => (isDefined(action.fundName) ? [action.fundName] : [])))) {
            const lastSellAllAt = trades
                .filter(trade => trade.fundName === fundName && trade.isSellAll && trade.occurredAt < statementCutoff)
                .reduce((latest, trade) => Math.max(latest, trade.occurredAt.getTime()), Number.NEGATIVE_INFINITY);
            const unknown = unknownBuys.filter(
                action => action.fundName === fundName && action.occurredAt < statementCutoff && action.occurredAt.getTime() > lastSellAllAt
            );
            const remaining = (statementMicroUnitsByFund.get(fundName) ?? Number.NaN) - (known.get(fundName) ?? 0);

            if (isPositiveNumber(remaining) && isNotEmptyArray(unknown)) {
                this.distribute(filled, unknown, remaining);
            }
        }

        return filled;
    }

    private distribute(
        filled: Map<string, InzhurResolvedQuantityInterface>,
        unknown: readonly InzhurPlannedActionInterface[],
        remainingMicroUnits: number
    ): void {
        let remainingTotal = remainingMicroUnits;
        let remainingWeight = unknown.reduce((sum, action) => sum + action.cashAmount, 0);

        for (const action of unknown) {
            const share = remainingWeight > 0 ? Math.round((remainingTotal * action.cashAmount) / remainingWeight) : 0;

            filled.set(action.externalId, { microUnits: share, isEstimated: false });
            remainingTotal -= share;
            remainingWeight -= action.cashAmount;
        }
    }
}

export const inzhurQuantityResolver = new InzhurQuantityResolver();
