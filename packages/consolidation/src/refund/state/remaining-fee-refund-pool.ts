import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

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

        for (const absorbedAmount of positiveAbsorbedAmounts) {
            this.removeMatchedSlot(absorbedAmount);
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

        this.removeMatchedSlot(amount);
        this.remainingTotal = Math.max(0, this.remainingTotal - amount);

        return true;
    }

    private removeMatchedSlot(amount: number): void {
        const slotIndex = this.remainingSlots.indexOf(amount);

        if (slotIndex >= 0) {
            this.remainingSlots.splice(slotIndex, 1);
        } else if (isNotEmptyArray(this.remainingSlots) && RemainingFeeRefundPool.sum(this.remainingSlots) === amount) {
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
