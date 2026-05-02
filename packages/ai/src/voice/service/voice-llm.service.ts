import { CurrencyEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { z } from 'zod';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { ITEM_EXTRACTION_PROMPT, VOICE_EXTRACTION_GENERATION_OPTIONS } from '../constant/voice-prompt.constant';
import { ExtractedVoiceTransactionInterface } from '../interface/extracted-voice-transaction.interface';
import { isCurrencyEnum } from '../type-guard/is-currency-enum.type-guard';
import { hasVoiceAmountSignal } from '../util/has-voice-amount-signal.util';
import { parseSimpleVoiceTransactions } from '../util/parse-simple-voice-transactions.util';

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
        text => `enter text="${text.slice(0, LOG_PREVIEW_LENGTH)}"`,
        result => `done count=${result.length}`,
        (error, text) => `throw text="${text.slice(0, LOG_PREVIEW_LENGTH)}" error=${getErrorMessage(error)}`
    )
    async extractTransactions(text: string): Promise<ExtractedVoiceTransactionInterface[]> {
        const simpleTransactions = parseSimpleVoiceTransactions(text);

        if (isNotEmptyArray(simpleTransactions)) {
            return simpleTransactions;
        }

        if (!hasVoiceAmountSignal(text)) {
            return [];
        }

        const response = await this.generateExtractionResponse(text);
        const parsed = this.parseExtractionResponse(response);

        return parsed;
    }

    @Log(
        text => `enter text="${text.slice(0, LOG_PREVIEW_LENGTH)}"`,
        (result, text) =>
            `done text="${text.slice(0, LOG_PREVIEW_LENGTH)}" response="${result.slice(0, LOG_PREVIEW_LENGTH)}" responseLen=${result.length}`,
        (error, text) => `throw text="${text.slice(0, LOG_PREVIEW_LENGTH)}" error=${getErrorMessage(error)}`
    )
    private async generateExtractionResponse(text: string): Promise<string> {
        return this.chat.generate(ITEM_EXTRACTION_PROMPT, text, VOICE_EXTRACTION_GENERATION_OPTIONS);
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
