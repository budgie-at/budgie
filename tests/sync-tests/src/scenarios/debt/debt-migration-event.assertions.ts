import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { DebtEventDirectionEnum, DebtEventSourceEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import type { DebtEventEntityInterface, DebtEventRepository } from '@budgie/contracts';

export class DebtMigrationEventAssertions {
    private static readonly DEBT_ACCOUNT_ID = Number('101');
    private static readonly EXPECTED_CLOSING_TOTAL = Number('8066');
    private static readonly EXPECTED_MANUAL_CLOSING_TOTAL = Number('4100');
    private static readonly EXPECTED_OPENING_TOTAL = Number('45000');
    private static readonly EXPECTED_TRANSACTION_CLOSING_TOTAL = Number('3966');
    private static readonly EXPECTED_TRANSACTION_IDS = ['1001', '1002', '1003', '1004', '1005', '1006', '1007'].map(Number);

    constructor(private readonly repository: DebtEventRepository) {}

    async assert(): Promise<void> {
        const debtEvents = await this.repository.findByAccountId(DebtMigrationEventAssertions.DEBT_ACCOUNT_ID);
        const openingEvents = debtEvents.filter(debtEvent => debtEvent.direction === DebtEventDirectionEnum.OPEN);
        const closingEvents = debtEvents.filter(debtEvent => debtEvent.direction === DebtEventDirectionEnum.CLOSE);
        const manualClosingEvents = closingEvents.filter(debtEvent => debtEvent.source === DebtEventSourceEnum.MANUAL);
        const transactionClosingEvents = closingEvents.filter(debtEvent => isDefined(debtEvent.transactionId));

        this.assertTotals(closingEvents, manualClosingEvents, transactionClosingEvents);
        this.assertRows(debtEvents, openingEvents, transactionClosingEvents);
    }

    private assertTotals(
        closingEvents: DebtEventEntityInterface[],
        manualClosingEvents: DebtEventEntityInterface[],
        transactionClosingEvents: DebtEventEntityInterface[]
    ): void {
        expect(this.sumAmount(closingEvents)).toBe(DebtMigrationEventAssertions.EXPECTED_CLOSING_TOTAL);
        expect(manualClosingEvents).toHaveLength(1);
        expect(this.sumAmount(manualClosingEvents)).toBe(DebtMigrationEventAssertions.EXPECTED_MANUAL_CLOSING_TOTAL);
        expect(this.sumAmount(transactionClosingEvents)).toBe(DebtMigrationEventAssertions.EXPECTED_TRANSACTION_CLOSING_TOTAL);
    }

    private assertRows(
        debtEvents: DebtEventEntityInterface[],
        openingEvents: DebtEventEntityInterface[],
        transactionClosingEvents: DebtEventEntityInterface[]
    ): void {
        expect(debtEvents.every(debtEvent => !isDefined(debtEvent.deletedAt))).toBe(true);
        expect(new Set(debtEvents.map(debtEvent => debtEvent.id)).size).toBe(debtEvents.length);
        expect(openingEvents).toHaveLength(1);
        expect(this.sumAmount(openingEvents)).toBe(DebtMigrationEventAssertions.EXPECTED_OPENING_TOTAL);
        expect(transactionClosingEvents).toHaveLength(DebtMigrationEventAssertions.EXPECTED_TRANSACTION_IDS.length);
        expect(transactionClosingEvents.map(debtEvent => debtEvent.transactionId).sort()).toEqual(
            DebtMigrationEventAssertions.EXPECTED_TRANSACTION_IDS
        );
    }

    private sumAmount(debtEvents: DebtEventEntityInterface[]): number {
        return convertFromMicroUnits(debtEvents.reduce((total, debtEvent) => total + debtEvent.amount, 0));
    }
}
