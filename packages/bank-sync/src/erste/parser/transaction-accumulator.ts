import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { parseErsteCardMerchant } from '../util/parse-erste-card-merchant.util';

import type { DateAmountInterface } from '../interface/date-amount.interface';
import type { ErsteCardMerchantInterface } from '../interface/erste-card-merchant.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

type MerchantInfo = Partial<Pick<ErsteCardMerchantInterface, 'city' | 'countryAlpha2'>>;

export class TransactionAccumulator {
    private readonly continuationLines: string[] = [];

    constructor(
        private readonly dateAmount: DateAmountInterface,
        private readonly primary: string
    ) {}

    addContinuationLine(line: string): void {
        this.continuationLines.push(line);
    }

    build(): ErsteRowInterface {
        const description = this.continuationLines.join(' ').trim();
        const reference = isNotEmptyString(this.primary) ? this.primary : description;
        const finalDescription = isNotEmptyString(description) ? description : reference;

        return {
            date: this.dateAmount.date,
            reference,
            description: finalDescription,
            details: '',
            amount: this.dateAmount.amount,
            isCredit: this.dateAmount.isCredit,
            ...this.findMerchantInfo()
        };
    }

    private findMerchantInfo(): MerchantInfo {
        for (const line of this.continuationLines) {
            const merchant = parseErsteCardMerchant(line);

            if (isDefined(merchant)) {
                return { city: merchant.city, countryAlpha2: merchant.countryAlpha2 };
            }
        }

        return {};
    }
}
