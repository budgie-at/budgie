import { CurrencyEnum, LanguageEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ChatInvoker } from '../../chat/service/chat-invoker.service';
import { ITEM_EXTRACTION_PROMPT, VOICE_EXTRACTION_GENERATION_OPTIONS } from '../constant/voice-prompt.constant';
import { ExtractedVoiceTransactionInterface } from '../interface/extracted-voice-transaction.interface';
import { isCurrencyEnum } from '../type-guard/is-currency-enum.type-guard';

export class VoiceLlmService extends Context.Service<VoiceLlmService>()('@budgie/ai/VoiceLlmService', {
    make: Effect.gen(function* () {
        const chat = yield* ChatInvoker;

        const escapeRegex = (term: string): string => term.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

        const buildAlternation = (terms: readonly string[]): string =>
            [...terms]
                .sort((firstTerm, secondTerm) => secondTerm.length - firstTerm.length)
                .map(term => escapeRegex(term))
                .join('|');

        const SUPPORTED_VOICE_CURRENCIES = [CurrencyEnum.UAH, CurrencyEnum.USD, CurrencyEnum.EUR] as const;

        const CURRENCY_TERMS_BY_LANGUAGE: Record<
            CurrencyEnum.UAH | CurrencyEnum.USD | CurrencyEnum.EUR,
            Record<LanguageEnum, readonly string[]>
        > = {
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

        const findCurrencyByTerm = (term: string): CurrencyEnum | null => {
            const normalized = term.toLowerCase();

            for (const currency of SUPPORTED_VOICE_CURRENCIES) {
                const allTerms = Object.values(CURRENCY_TERMS_BY_LANGUAGE[currency]).flat();
                if (allTerms.includes(normalized)) {
                    return currency;
                }
            }

            return null;
        };

        const EXTRACTED_ITEM_SCHEMA = Schema.Struct({
            description: Schema.String,
            amount: Schema.Number,
            currency: Schema.optional(Schema.NullOr(Schema.String))
        });

        const decodeJson = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Unknown));

        const decodeItem = Schema.decodeUnknownOption(EXTRACTED_ITEM_SCHEMA);

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

        const ALL_CURRENCY_TERMS = Object.values(CURRENCY_TERMS_BY_LANGUAGE).flatMap(byLanguage => Object.values(byLanguage).flat());

        const ALL_NUMBER_WORDS = Object.values(NUMBER_WORDS_BY_LANGUAGE).flat();

        const ALL_ITEM_SEPARATORS = Object.values(ITEM_SEPARATORS_BY_LANGUAGE).flat();

        const AMOUNT_PATTERN = new RegExp(String.raw`(\d+(?:[.,]\d+)?)\s*(${buildAlternation(ALL_CURRENCY_TERMS)})?`, 'iu');

        const ITEM_SEPARATOR_PATTERN = new RegExp(String.raw`;+|,(?!\d)|\s+(?:${buildAlternation(ALL_ITEM_SEPARATORS)})\s+`, 'iu');

        const DIGIT_PATTERN = /\d/u;

        const NUMBER_WORD_PATTERN = new RegExp(String.raw`\b(${buildAlternation(ALL_NUMBER_WORDS)})\b`, 'iu');

        const CURRENCY_TERM_PATTERN = new RegExp(String.raw`(^|\s+)(${buildAlternation(ALL_CURRENCY_TERMS)})(?=$|\s+|[.,!?])`, 'giu');

        const cleanVoiceDescription = (description: string): string =>
            description
                .replace(CURRENCY_TERM_PATTERN, ' ')
                .replace(/(?:^|\s)[-–—−]+(?:\s|$)/gu, ' ')
                .replace(/\s+/gu, ' ')
                .replace(/^[-–—−.,!?\s]+|[-–—−.,!?\s]+$/gu, '')
                .trim();

        const findCurrencyInSegment = (segment: string): CurrencyEnum | null => {
            const match = segment.match(CURRENCY_TERM_PATTERN);
            const currencyTerm = match?.at(0)?.trim();

            return isNotEmptyString(currencyTerm) ? findCurrencyByTerm(currencyTerm) : null;
        };

        const normalizeVoiceCurrency = (currency: string | undefined): CurrencyEnum | null => {
            if (!isNotEmptyString(currency)) {
                return null;
            }

            return findCurrencyByTerm(currency);
        };

        const parseVoiceSegment = (segment: string): ExtractedVoiceTransactionInterface | null => {
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
            const description = cleanVoiceDescription([beforeAmount, afterAmount].filter(isNotEmptyString).join(' '));

            if (!isNotEmptyString(description)) {
                return null;
            }

            return {
                amount,
                currency: normalizeVoiceCurrency(match[2]) ?? findCurrencyInSegment(segment),
                description
            };
        };

        const parseSimpleVoiceTransactions = (text: string): ExtractedVoiceTransactionInterface[] =>
            text
                .split(ITEM_SEPARATOR_PATTERN)
                .map(segment => segment.trim())
                .filter(isNotEmptyString)
                .map(segment => parseVoiceSegment(segment))
                .filter(isDefined);

        const hasVoiceAmountSignal = (text: string): boolean => {
            if (!isNotEmptyString(text)) {
                return false;
            }
            if (DIGIT_PATTERN.test(text)) {
                return true;
            }

            return NUMBER_WORD_PATTERN.test(text);
        };

        const validateCurrency = (currency: string | null | undefined): CurrencyEnum | null => {
            if (!isDefined(currency)) {
                return null;
            }

            const normalized = currency.toUpperCase();

            return isCurrencyEnum(normalized) ? normalized : null;
        };

        const mapToTransaction = (item: typeof EXTRACTED_ITEM_SCHEMA.Type): ExtractedVoiceTransactionInterface => ({
            description: item.description,
            amount: item.amount,
            currency: validateCurrency(item.currency)
        });

        const fixMalformedJson = (text: string): string => {
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
        };

        const parseExtractionResponse = (response: string): ExtractedVoiceTransactionInterface[] => {
            const parsed = decodeJson(fixMalformedJson(response));

            if (Option.isNone(parsed)) {
                return [];
            }

            const items = Array.isArray(parsed.value) ? parsed.value : [parsed.value];

            return items
                .map(item => decodeItem(item))
                .filter(Option.isSome)
                .map(item => mapToTransaction(item.value));
        };

        const extractTransactions = Effect.fn('VoiceLlmService.extractTransactions')(function* (text: string) {
            const simpleTransactions = parseSimpleVoiceTransactions(text);

            if (isNotEmptyArray(simpleTransactions)) {
                return simpleTransactions;
            }

            if (!hasVoiceAmountSignal(text)) {
                return [];
            }

            const response = yield* chat.generate(ITEM_EXTRACTION_PROMPT, text, VOICE_EXTRACTION_GENERATION_OPTIONS);

            return parseExtractionResponse(response);
        });

        return { extractTransactions };
    })
}) {
    static readonly layer = Layer.effect(VoiceLlmService, VoiceLlmService.make);
}
