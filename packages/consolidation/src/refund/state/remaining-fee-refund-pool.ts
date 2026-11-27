import { isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

export class RemainingFeeRefundPool {
    private readonly remainingSlots: number[];
    private remainingTotal: number;

    private constructor(liveFeeAmounts: readonly number[], absorbedFeeAmounts: readonly number[]) {
        this.remainingSlots = liveFeeAmounts.filter(isPositiveNumber);
        const positiveAbsorbedAmounts = absorbedFeeAmounts.filter(isPositiveNumber);

        this.remainingTotal = Math.max(
            0,
            RemainingFeeRefundPool.sum(this.remainingSlots) - RemainingFeeRefundPool.sum(positiveAbsorbedAmounts)
        );

        const unmatchedAbsorbedAmounts: number[] = [];

        for (const absorbedAmount of positiveAbsorbedAmounts) {
            if (!this.removeExactSlot(absorbedAmount)) {
                unmatchedAbsorbedAmounts.push(absorbedAmount);
            }
        }

        for (const absorbedAmount of unmatchedAbsorbedAmounts) {
            this.removeAggregateSlots(absorbedAmount);
        }
    }

    get total(): number {
        return this.remainingTotal;
    }

    canConsume(amount: number): boolean {
        return (
            isPositiveNumber(amount) &&
            amount <= this.remainingTotal &&
            (this.remainingSlots.includes(amount) ||
                (isNotEmptyArray(this.remainingSlots) && RemainingFeeRefundPool.sum(this.remainingSlots) === amount))
        );
    }

    consume(amount: number): boolean {
        if (!this.canConsume(amount)) {
            return false;
        }

        if (!this.removeExactSlot(amount)) {
            this.removeAggregateSlots(amount);
        }

        this.remainingTotal = Math.max(0, this.remainingTotal - amount);

        return true;
    }

    consumeAll(amounts: readonly number[]): boolean {
        const unmatchedAmounts: number[] = [];

        for (const amount of amounts) {
            if (!isPositiveNumber(amount) || amount > this.remainingTotal) {
                return false;
            }

            if (this.removeExactSlot(amount)) {
                this.remainingTotal = Math.max(0, this.remainingTotal - amount);
            } else {
                unmatchedAmounts.push(amount);
            }
        }

        if (isEmptyArray(unmatchedAmounts)) {
            return true;
        }

        return unmatchedAmounts.length === 1 && this.consume(unmatchedAmounts[0]);
    }

    private removeExactSlot(amount: number): boolean {
        const slotIndex = this.remainingSlots.indexOf(amount);

        if (slotIndex < 0) {
            return false;
        }

        this.remainingSlots.splice(slotIndex, 1);

        return true;
    }

    private removeAggregateSlots(amount: number): void {
        if (isNotEmptyArray(this.remainingSlots) && RemainingFeeRefundPool.sum(this.remainingSlots) === amount) {
            this.remainingSlots.length = 0;
        }
    }

    static fromAmounts(liveFeeAmounts: readonly number[], absorbedFeeAmounts: readonly number[]): RemainingFeeRefundPool {
        return new RemainingFeeRefundPool(liveFeeAmounts, absorbedFeeAmounts);
    }

    static fromCsv(feeAmountsCsv: string, absorbedFeeAmountsCsv: string): RemainingFeeRefundPool {
        return new RemainingFeeRefundPool(
            RemainingFeeRefundPool.parseCsv(feeAmountsCsv),
            RemainingFeeRefundPool.parseCsv(absorbedFeeAmountsCsv)
        );
    }

    private static parseCsv(csv: string): number[] {
        if (!isNotEmptyString(csv)) {
            return [];
        }

        return csv
            .split(',')
            .map(part => Number(part.trim()))
            .filter(value => Number.isFinite(value) && isPositiveNumber(value));
    }

    private static sum(values: readonly number[]): number {
        return values.reduce((total, value) => total + value, 0);
    }
}
