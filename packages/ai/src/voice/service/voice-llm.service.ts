import { CurrencyEnum, Log } from '@budgie/contracts';
import { z } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { ITEM_EXTRACTION_PROMPT, VOICE_TRANSLATION_PROMPT } from '../constant/voice-prompt.constant';
import { ExtractedVoiceTransactionInterface } from '../interface/extracted-voice-transaction.interface';
import { isCurrencyEnum } from '../type-guard/is-currency-enum.type-guard';

const LOG_PREVIEW_LENGTH = 120;

const ExtractedItemSchema = z.object({
    description: z.string(),
    amount: z.number(),
    currency: z.string().nullable().optional()
});

type ExtractedItemType = z.infer<typeof ExtractedItemSchema>;

export class VoiceLlmService {
    constructor(private readonly chat: ChatInvokerInterface) {}

    @Log(
        (text: string) => `extractTransactions:enter textLen=${text.length} preview=${text.slice(0, LOG_PREVIEW_LENGTH)}`,
        (result, text: string) => `extractTransactions:done textLen=${text.length} count=${result.length}`,
        (error, text: string) => `extractTransactions:throw textLen=${text.length} error=${String(error)}`
    )
    async extractTransactions(text: string): Promise<ExtractedVoiceTransactionInterface[]> {
        const translatedText = await this.performTranslation(text);
        const response = await this.chat.generate(ITEM_EXTRACTION_PROMPT, translatedText);

        return this.parseExtractionResponse(response);
    }

    @Log(
        (text: string) => `performTranslation:enter textLen=${text.length}`,
        (result, text: string) => `performTranslation:done textLen=${text.length} translatedLen=${result.length}`,
        (error, text: string) => `performTranslation:throw textLen=${text.length} error=${String(error)}`
    )
    private async performTranslation(text: string): Promise<string> {
        const translated = await this.chat.generate(VOICE_TRANSLATION_PROMPT, text);

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
