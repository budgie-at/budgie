import { isDefined } from '@rnw-community/shared';

import { TransactionAccumulator } from './transaction-accumulator';

import type { DateAmountInterface } from '../interface/date-amount.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

export class ParserState {
    private inSection = false;
    private current: TransactionAccumulator | null = null;
    private readonly transactions: ErsteRowInterface[] = [];

    enterSection(): void {
        this.inSection = true;
    }

    exitSection(): void {
        this.flush();
        this.inSection = false;
    }

    isInSection(): boolean {
        return this.inSection;
    }

    startTransaction(dateAmount: DateAmountInterface, primary: string): void {
        this.flush();
        this.current = new TransactionAccumulator(dateAmount, primary);
    }

    addContinuationLine(line: string): void {
        if (isDefined(this.current)) {
            this.current.addContinuationLine(line);
        }
    }

    hasCurrent(): boolean {
        return isDefined(this.current);
    }

    flush(): void {
        if (isDefined(this.current)) {
            this.transactions.push(this.current.build());
            this.current = null;
        }
    }

    getTransactions(): ErsteRowInterface[] {
        return this.transactions;
    }
}
