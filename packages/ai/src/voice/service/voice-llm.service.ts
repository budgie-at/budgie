import { CurrencyEnum } from '@budgie/contracts';
import { z } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { LlmInterface } from '../../@generic/interface/llm.interface';
import { ITEM_EXTRACTION_PROMPT, VOICE_TRANSLATION_PROMPT } from '../constant/voice-prompt.constant';
import { ExtractedVoiceTransactionInterface } from '../interface/extracted-voice-transaction.interface';
import { isCurrencyEnum } from '../type-guard/is-currency-enum.type-guard';

const ExtractedItemSchema = z.object({
    description: z.string(),
    amount: z.number(),
    currency: z.string().nullable().optional()
});

type ExtractedItemType = z.infer<typeof ExtractedItemSchema>;

export class VoiceLlmService {
    constructor(private readonly llm: LlmInterface) {}

    async extractTransactions(text: string): Promise<ExtractedVoiceTransactionInterface[]> {
        const translatedText = await this.translateToEnglish(text);
        const response = await this.llm.generate(ITEM_EXTRACTION_PROMPT, translatedText);

        return this.parseExtractionResponse(response);
    }

    private async translateToEnglish(text: string): Promise<string> {
        const translated = await this.llm.generate(VOICE_TRANSLATION_PROMPT, text);

        return translated.trim();
    }

    private parseExtractionResponse(response: string): ExtractedVoiceTransactionInterface[] {
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

    private mapToTransaction(item: ExtractedItemType): ExtractedVoiceTransactionInterface {
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

        return isCurrencyEnum(normalized) ? normalized : null;
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
