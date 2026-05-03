/* eslint-disable max-lines -- Cohesive language-keyed keyword tables (numbers, currency aliases, separators) for the voice extractor must stay together */
import { CurrencyEnum, LanguageEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { z } from 'zod';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ChatInvokerInterface } from '../../chat/interface/chat-invoker.interface';
import { ITEM_EXTRACTION_PROMPT, VOICE_EXTRACTION_GENERATION_OPTIONS } from '../constant/voice-prompt.constant';
import { ExtractedVoiceTransactionInterface } from '../interface/extracted-voice-transaction.interface';
import { isCurrencyEnum } from '../type-guard/is-currency-enum.type-guard';

const LOG_PREVIEW_LENGTH = 120;

const ExtractedItemSchema = z.object({
    description: z.string(),
    amount: z.number(),
    currency: z.string().nullable().optional()
});

type ExtractedItemType = z.infer<typeof ExtractedItemSchema>;

type SupportedVoiceCurrency = CurrencyEnum.UAH | CurrencyEnum.USD | CurrencyEnum.EUR;

const CURRENCY_TERMS_BY_LANGUAGE: Record<SupportedVoiceCurrency, Record<LanguageEnum, readonly string[]>> = {
    [CurrencyEnum.UAH]: {
        [LanguageEnum.UK]: ['грн', 'гривень', 'гривня', 'гривні', 'гривен', '₴'],
        [LanguageEnum.EN]: ['uah', 'hryvnia', 'hryvnias'],
        [LanguageEnum.DE]: ['uah', 'hrywnja'],
        [LanguageEnum.ES]: ['uah', 'grivna', 'grivnas'],
        [LanguageEnum.FR]: ['uah', 'hryvnia', 'hryvnias']
    },
    [CurrencyEnum.USD]: {
        [LanguageEnum.EN]: ['usd', '$', 'dollar', 'dollars', 'buck', 'bucks', 'dol'],
        [LanguageEnum.UK]: ['долар', 'доларів', 'долари'],
        [LanguageEnum.DE]: ['dollar', 'dollars'],
        [LanguageEnum.ES]: ['dólar', 'dólares', 'dolar', 'dolares'],
        [LanguageEnum.FR]: ['dollar', 'dollars']
    },
    [CurrencyEnum.EUR]: {
        [LanguageEnum.EN]: ['eur', '€', 'euro', 'euros'],
        [LanguageEnum.UK]: ['євро', 'євра'],
        [LanguageEnum.DE]: ['euro', 'euros'],
        [LanguageEnum.ES]: ['euro', 'euros'],
        [LanguageEnum.FR]: ['euro', 'euros']
    }
};

const NUMBER_WORDS_BY_LANGUAGE: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: [
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'eleven',
        'twelve',
        'twenty',
        'thirty',
        'forty',
        'fifty',
        'sixty',
        'seventy',
        'eighty',
        'ninety',
        'hundred',
        'thousand'
    ],
    [LanguageEnum.UK]: [
        'один',
        'одна',
        'два',
        'дві',
        'три',
        'чотири',
        "п'ять",
        'пʼять',
        'шість',
        'сім',
        'вісім',
        "дев'ять",
        'девʼять',
        'десять',
        'двадцять',
        'тридцять',
        'сорок',
        "п'ятдесят",
        'пʼятдесят',
        'шістдесят',
        'сімдесят',
        'вісімдесят',
        "дев'яносто",
        'девʼяносто',
        'сто',
        'тисяча'
    ],
    [LanguageEnum.DE]: [
        'eins',
        'zwei',
        'drei',
        'vier',
        'fünf',
        'sechs',
        'sieben',
        'acht',
        'neun',
        'zehn',
        'elf',
        'zwölf',
        'zwanzig',
        'dreißig',
        'vierzig',
        'fünfzig',
        'sechzig',
        'siebzig',
        'achtzig',
        'neunzig',
        'hundert',
        'tausend'
    ],
    [LanguageEnum.ES]: [
        'uno',
        'dos',
        'tres',
        'cuatro',
        'cinco',
        'seis',
        'siete',
        'ocho',
        'nueve',
        'diez',
        'once',
        'doce',
        'veinte',
        'treinta',
        'cuarenta',
        'cincuenta',
        'sesenta',
        'setenta',
        'ochenta',
        'noventa',
        'cien',
        'ciento',
        'mil'
    ],
    [LanguageEnum.FR]: [
        'un',
        'une',
        'deux',
        'trois',
        'quatre',
        'cinq',
        'six',
        'sept',
        'huit',
        'neuf',
        'dix',
        'onze',
        'douze',
        'vingt',
        'trente',
        'quarante',
        'cinquante',
        'soixante',
        'cent',
        'mille'
    ]
};

const ITEM_SEPARATORS_BY_LANGUAGE: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['and'],
    [LanguageEnum.UK]: ['і', 'та'],
    [LanguageEnum.DE]: ['und'],
    [LanguageEnum.ES]: ['y', 'e'],
    [LanguageEnum.FR]: ['et']
};

const escapeRegex = (term: string): string => term.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

const buildAlternation = (terms: readonly string[]): string =>
    terms
        .toSorted((firstTerm, secondTerm) => secondTerm.length - firstTerm.length)
        .map(escapeRegex)
        .join('|');

const ALL_CURRENCY_TERMS = Object.values(CURRENCY_TERMS_BY_LANGUAGE).flatMap(byLanguage => Object.values(byLanguage).flat());
const ALL_NUMBER_WORDS = Object.values(NUMBER_WORDS_BY_LANGUAGE).flat();
const ALL_ITEM_SEPARATORS = Object.values(ITEM_SEPARATORS_BY_LANGUAGE).flat();

const AMOUNT_PATTERN = new RegExp(String.raw`(\d+(?:[.,]\d+)?)\s*(${buildAlternation(ALL_CURRENCY_TERMS)})?`, 'iu');

const ITEM_SEPARATOR_PATTERN = new RegExp(String.raw`;+|,(?!\d)|\s+(?:${buildAlternation(ALL_ITEM_SEPARATORS)})\s+`, 'iu');

const DIGIT_PATTERN = /\d/u;

const NUMBER_WORD_PATTERN = new RegExp(String.raw`\b(${buildAlternation(ALL_NUMBER_WORDS)})\b`, 'iu');

const findCurrencyByTerm = (term: string): SupportedVoiceCurrency | null => {
    const normalized = term.toLowerCase();

    for (const [currency, byLanguage] of Object.entries(CURRENCY_TERMS_BY_LANGUAGE)) {
        const allTerms = Object.values(byLanguage).flat();
        if (allTerms.includes(normalized)) {
            return currency as SupportedVoiceCurrency;
        }
    }

    return null;
};

export class VoiceLlmService {
    constructor(private readonly chat: ChatInvokerInterface) {}

    @Log(
        text => `enter text="${text.slice(0, LOG_PREVIEW_LENGTH)}"`,
        result => `done count=${result.length}`,
        (error, text) => `throw text="${text.slice(0, LOG_PREVIEW_LENGTH)}" error=${getErrorMessage(error)}`
    )
    async extractTransactions(text: string): Promise<ExtractedVoiceTransactionInterface[]> {
        const simpleTransactions = this.parseSimpleVoiceTransactions(text);

        if (isNotEmptyArray(simpleTransactions)) {
            return simpleTransactions;
        }

        if (!this.hasVoiceAmountSignal(text)) {
            return [];
        }

        const response = await this.generateExtractionResponse(text);

        return this.parseExtractionResponse(response);
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

    private parseSimpleVoiceTransactions(text: string): ExtractedVoiceTransactionInterface[] {
        return text
            .split(ITEM_SEPARATOR_PATTERN)
            .map(segment => segment.trim())
            .filter(isNotEmptyString)
            .map(segment => this.parseVoiceSegment(segment))
            .filter(isDefined);
    }

    private parseVoiceSegment(segment: string): ExtractedVoiceTransactionInterface | null {
        const match = segment.match(AMOUNT_PATTERN);

        if (!isDefined(match) || !isDefined(match.index)) {
            return null;
        }

        const amount = Number(match[1].replace(',', '.'));

        if (!Number.isFinite(amount) || amount <= 0) {
            return null;
        }

        const beforeAmount = segment.slice(0, match.index).trim();
        const afterAmount = segment.slice(match.index + match[0].length).trim();
        const description = [beforeAmount, afterAmount].filter(isNotEmptyString).join(' ').trim();

        if (!isNotEmptyString(description)) {
            return null;
        }

        return {
            amount,
            currency: this.normalizeVoiceCurrency(match[2]),
            description
        };
    }

    private normalizeVoiceCurrency(currency: string | undefined): CurrencyEnum | null {
        if (!isNotEmptyString(currency)) {
            return null;
        }

        return findCurrencyByTerm(currency);
    }

    private hasVoiceAmountSignal(text: string): boolean {
        if (!isNotEmptyString(text)) {
            return false;
        }
        if (DIGIT_PATTERN.test(text)) {
            return true;
        }

        return NUMBER_WORD_PATTERN.test(text);
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
