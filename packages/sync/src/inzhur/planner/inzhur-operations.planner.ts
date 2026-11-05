import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';

import { InzhurOperationKindEnum } from '../enum/inzhur-operation-kind.enum';

import type { InzhurOperationInterface } from '../interface/inzhur-operation.interface';
import type { InzhurOperationsPlanInterface } from '../interface/inzhur-operations-plan.interface';
import type { InzhurPlannedActionInterface } from '../interface/inzhur-planned-action.interface';

class InzhurOperationsPlanner {
    private static readonly TIME_ZONE = 'Europe/Kyiv';

    plan(operations: readonly InzhurOperationInterface[]): InzhurOperationsPlanInterface {
        const surcharges = operations.filter(operation => operation.kind === InzhurOperationKindEnum.SURCHARGE);
        const claimedSurcharges = new Set<InzhurOperationInterface>();
        const actions = operations
            .filter(operation => operation.kind !== InzhurOperationKindEnum.SURCHARGE)
            .map(operation => this.toAction(operation, surcharges, claimedSurcharges));
        const orphanSurcharges = surcharges.filter(surcharge => !claimedSurcharges.has(surcharge));
        const surchargeAmount = convertFromMicroUnits(
            [...claimedSurcharges].reduce((sum, surcharge) => sum + convertToMicroUnits(surcharge.credit), 0)
        );
        const first = operations.at(0);
        const last = operations.at(-1);

        return {
            actions,
            orphanSurcharges,
            surchargeAmount,
            firstAt: first?.occurredAt ?? new Date(0),
            lastAt: last?.occurredAt ?? new Date(0),
            isFullHistory: first?.kind === InzhurOperationKindEnum.TOP_UP && !this.dipsBelowZero(operations),
            cashTotal: convertFromMicroUnits(operations.reduce((sum, operation) => sum + this.cashDelta(operation), 0))
        };
    }

    private cashDelta(operation: InzhurOperationInterface): number {
        return convertToMicroUnits(operation.debit) - convertToMicroUnits(operation.credit);
    }

    private dipsBelowZero(operations: readonly InzhurOperationInterface[]): boolean {
        let balance = 0;

        for (const operation of operations) {
            balance += this.cashDelta(operation);

            if (balance < 0) {
                return true;
            }
        }

        return false;
    }

    private toDay(date: Date): string {
        return date.toLocaleDateString('en-CA', { timeZone: InzhurOperationsPlanner.TIME_ZONE });
    }

    private toAction(
        operation: InzhurOperationInterface,
        surcharges: readonly InzhurOperationInterface[],
        claimedSurcharges: Set<InzhurOperationInterface>
    ): InzhurPlannedActionInterface {
        const { externalId, kind, occurredAt, fundName, quantity, debit, credit } = operation;
        const base = { externalId, occurredAt, fundName, quantity, isSellAll: false, isConversion: false };

        if (kind === InzhurOperationKindEnum.CONVERSION) {
            return this.toConversionAction({ ...base, kind }, operation, surcharges, claimedSurcharges);
        }

        const isDebitSide =
            kind === InzhurOperationKindEnum.TOP_UP || kind === InzhurOperationKindEnum.SELL || kind === InzhurOperationKindEnum.DIVIDEND;

        return { ...base, kind, cashAmount: isDebitSide ? debit : credit };
    }

    private toConversionAction(
        base: Omit<InzhurPlannedActionInterface, 'cashAmount'>,
        operation: InzhurOperationInterface,
        surcharges: readonly InzhurOperationInterface[],
        claimedSurcharges: Set<InzhurOperationInterface>
    ): InzhurPlannedActionInterface {
        const { occurredAt, fundName, debit, credit } = operation;

        if (debit > 0) {
            return { ...base, kind: InzhurOperationKindEnum.SELL, cashAmount: debit, isSellAll: true, isConversion: true };
        }

        const day = this.toDay(occurredAt);
        const attached = surcharges.filter(
            surcharge => surcharge.fundName === fundName && !claimedSurcharges.has(surcharge) && this.toDay(surcharge.occurredAt) === day
        );

        for (const surcharge of attached) {
            claimedSurcharges.add(surcharge);
        }

        const cost = attached.reduce((sum, surcharge) => sum + convertToMicroUnits(surcharge.credit), convertToMicroUnits(credit));

        return { ...base, kind: InzhurOperationKindEnum.BUY, cashAmount: convertFromMicroUnits(cost), isConversion: true };
    }
}

export const inzhurOperationsPlanner = new InzhurOperationsPlanner();
