import { AccountWithInstrumentEntityInterface, CurrencyEnum } from '@budgie/contracts';
import { z } from 'zod';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LlmInterface } from '../context/llm.context';
import { AITransactionInterface } from '../interface/ai-transaction.interface';

export interface ExtractedVoiceTransaction {
    description: string;
    amount: number;
    currency: CurrencyEnum | null;
}

export interface GroupedVoiceTransactionInterface {
    amount: number;
    currency: CurrencyEnum | null;
    account: AccountWithInstrumentEntityInterface | null;
    comment: string;
    aiContext: string;
}

export const groupVoiceTransactions = (
    transactions: AITransactionInterface[],
    originalText: string
): GroupedVoiceTransactionInterface | null => {
    if (!isNotEmptyArray(transactions)) {
        return null;
    }

    const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const aiContext = transactions.map(transaction => transaction.comment).join(', ');
    const [firstTransaction] = transactions;

    return {
        amount: totalAmount,
        currency: firstTransaction.currency,
        account: firstTransaction.account,
        comment: originalText,
        aiContext
    };
};

const ExtractedItemSchema = z.object({
    description: z.string(),
    amount: z.number(),
    currency: z.string().nullable().optional()
});

type ExtractedItemType = z.infer<typeof ExtractedItemSchema>;

const CURRENCY_ENUM_VALUES = new Set<string>(Object.values(CurrencyEnum));

/* eslint-disable lingui/no-unlocalized-strings */
const VOICE_TRANSLATION_PROMPT = `Translate expense input to English. Keep numbers and currencies exactly as-is. Return ONLY the translation.

Examples:
кава 50 грн -> coffee 50 uah
таксі додому 120 -> taxi home 120
обід в ресторані 350 uah -> lunch at restaurant 350 uah
продукти в АТБ 890 -> groceries at ATB 890
бензин 1200 грн, мийка 150 -> gas 1200 uah, car wash 150
подарунок мамі 500 -> gift for mom 500
ліки в аптеці 230 -> medicine at pharmacy 230`;

const ITEM_EXTRACTION_PROMPT = `Extract expense items from text. Return JSON array with description, amount, and currency.

FORMAT: [{"description":"what was bought","amount":N,"currency":"XXX"}]

RULES:
- description = short phrase describing the expense (2-5 words)
- amount = number only
- currency = 3-letter code (UAH, USD, EUR) or null if not specified
- ONE amount = ONE item

Examples:
"coffee 50 uah" -> [{"description":"coffee","amount":50,"currency":"UAH"}]
"taxi home 120" -> [{"description":"taxi home","amount":120,"currency":null}]
"lunch at restaurant 350 uah" -> [{"description":"lunch at restaurant","amount":350,"currency":"UAH"}]
"groceries 890, gas 1200 uah" -> [{"description":"groceries","amount":890,"currency":null},{"description":"gas","amount":1200,"currency":"UAH"}]
"coffee 50, taxi 120, lunch 350" -> [{"description":"coffee","amount":50,"currency":null},{"description":"taxi","amount":120,"currency":null},{"description":"lunch","amount":350,"currency":null}]`;
/* eslint-enable lingui/no-unlocalized-strings */

export class VoiceLlmService {
    constructor(private readonly llm: LlmInterface) {}

    async extractTransactions(text: string): Promise<ExtractedVoiceTransaction[]> {
        const translatedText = await this.translateToEnglish(text);
        const response = await this.llm.generate(ITEM_EXTRACTION_PROMPT, translatedText);

        return this.parseExtractionResponse(response);
    }

    private async translateToEnglish(text: string): Promise<string> {
        const translated = await this.llm.generate(VOICE_TRANSLATION_PROMPT, text);

        return translated.trim();
    }

    private parseExtractionResponse(response: string): ExtractedVoiceTransaction[] {
        const jsonStr = this.fixMalformedJson(response);

        try {
            const parsed = JSON.parse(jsonStr) as unknown;

            if (Array.isArray(parsed)) {
                return parsed
                    .map(item => {
                        const result = ExtractedItemSchema.safeParse(item);

                        return result.success ? this.mapToTransaction(result.data) : null;
                    })
                    .filter(isDefined);
            }

            const singleResult = ExtractedItemSchema.safeParse(parsed);
            if (singleResult.success) {
                return [this.mapToTransaction(singleResult.data)];
            }
        } catch {
            return [];
        }

        return [];
    }

    private mapToTransaction(item: ExtractedItemType): ExtractedVoiceTransaction {
        return {
            description: item.description,
            amount: item.amount,
            currency: this.validateCurrency(item.currency)
        };
    }

    private validateCurrency(currency: string | null | undefined): CurrencyEnum | null {
        if (!isDefined(currency)) {
            return null;
        }

        const normalized = currency.toUpperCase();

        return CURRENCY_ENUM_VALUES.has(normalized) ? (normalized as CurrencyEnum) : null;
    }

    private fixMalformedJson(text: string): string {
        let cleaned = text.trim();

        const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/u);
        if (isDefined(codeBlockMatch)) {
            cleaned = codeBlockMatch[1].trim();
        }

        if (!cleaned.startsWith('[') && cleaned.includes('{')) {
            cleaned = `[${cleaned}`;
        }

        if (!cleaned.endsWith(']') && cleaned.includes('}')) {
            cleaned = `${cleaned}]`;
        }

        cleaned = cleaned.replace(/,\s*\]/gu, ']');
        cleaned = cleaned.replace(/\}\s*\{/gu, '},{');

        return cleaned;
    }
}
