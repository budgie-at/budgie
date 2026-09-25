import { LanguageEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CATEGORIZE_INBOX_MASKED_PAN_PATTERN } from '../constant/categorize-inbox-masked-pan-pattern.constant';

import type { CategorizeInboxMerchantKeysInterface } from '../interface/categorize-inbox-merchant-keys.interface';

class CategorizeInboxMerchantKeyService {
    private static readonly LEGAL_FORM_TOKENS: Record<LanguageEnum, readonly string[]> = {
        [LanguageEnum.EN]: ['ltd', 'llc', 'inc', 'co', 'bv'],
        [LanguageEnum.UK]: ['тов', 'фоп', 'пп', 'ооо'],
        [LanguageEnum.DE]: ['gmbh', 'ag', 'kg', 'og'],
        [LanguageEnum.FR]: ['sa'],
        [LanguageEnum.ES]: ['sa', 'srl']
    };

    private static readonly WEB_NOISE_TOKENS: readonly string[] = ['www', 'com', 'net', 'org', 'http', 'https'];

    private static readonly NOISE_TOKENS: ReadonlySet<string> = new Set([
        ...Object.values(CategorizeInboxMerchantKeyService.LEGAL_FORM_TOKENS).flat(),
        ...CategorizeInboxMerchantKeyService.WEB_NOISE_TOKENS
    ]);

    private static readonly NOISE_PATTERNS: readonly RegExp[] = [
        /(?<![\p{L}\p{N}])\p{L}{2,8}:\S+/gu,
        /https?:\/\/\S+|\bwww\./gu,
        new RegExp(CATEGORIZE_INBOX_MASKED_PAN_PATTERN, 'gu'),
        /\+?\d[\d\s-]{6,}\d/gu
    ];

    private static readonly DIACRITIC_PATTERN = /\p{Diacritic}/gu;
    private static readonly TOKEN_SEPARATOR_PATTERN = /[^\p{L}]+/u;
    private static readonly LIMITS = {
        minTokenLength: 2,
        dfMinCount: 25,
        dfRatio: 0.02,
        cacheSize: 20000,
        normalizedTokenCount: 4,
        prefixTokenCount: 2
    } as const;

    private readonly tokenCache = new Map<string, readonly string[]>();
    private commonTokens: ReadonlySet<string> = new Set();

    prepare(titles: readonly string[]): void {
        if (this.tokenCache.size > CategorizeInboxMerchantKeyService.LIMITS.cacheSize) {
            this.tokenCache.clear();
        }

        const distinctTokenSets = new Set(titles.map(title => [...new Set(this.tokenize(title))].sort().join(' ')));
        const documentFrequency = new Map<string, number>();

        distinctTokenSets.forEach(tokenSet => {
            tokenSet
                .split(' ')
                .filter(isNotEmptyString)
                .forEach(token => documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1));
        });

        const threshold = Math.max(
            CategorizeInboxMerchantKeyService.LIMITS.dfMinCount,
            CategorizeInboxMerchantKeyService.LIMITS.dfRatio * distinctTokenSets.size
        );

        this.commonTokens = new Set([...documentFrequency].filter(([, frequency]) => frequency >= threshold).map(([token]) => token));
    }

    buildKeys(title: string): CategorizeInboxMerchantKeysInterface {
        const tokens = this.tokenize(title);
        const merchantTokens = [...new Set(tokens.filter(token => !this.commonTokens.has(token)))];
        const prefixKey =
            merchantTokens.length > CategorizeInboxMerchantKeyService.LIMITS.prefixTokenCount
                ? merchantTokens.slice(0, CategorizeInboxMerchantKeyService.LIMITS.prefixTokenCount).join(' ')
                : null;

        return { normalizedKey: this.buildNormalizedKey(title, tokens, merchantTokens), prefixKey };
    }

    private buildNormalizedKey(title: string, tokens: readonly string[], merchantTokens: readonly string[]): string {
        if (isNotEmptyArray(merchantTokens)) {
            return merchantTokens.slice(0, CategorizeInboxMerchantKeyService.LIMITS.normalizedTokenCount).join(' ');
        }

        if (isNotEmptyArray(tokens)) {
            return tokens.slice(0, CategorizeInboxMerchantKeyService.LIMITS.prefixTokenCount).join(' ');
        }

        return title.trim().toLowerCase();
    }

    private tokenize(title: string): readonly string[] {
        const cached = this.tokenCache.get(title);

        if (isDefined(cached)) {
            return cached;
        }

        const cleaned = CategorizeInboxMerchantKeyService.NOISE_PATTERNS.reduce(
            (text, pattern) => text.replace(pattern, ' '),
            title.normalize('NFKD').replace(CategorizeInboxMerchantKeyService.DIACRITIC_PATTERN, '').toLowerCase()
        );
        const tokens = cleaned
            .split(CategorizeInboxMerchantKeyService.TOKEN_SEPARATOR_PATTERN)
            .filter(
                token =>
                    token.length >= CategorizeInboxMerchantKeyService.LIMITS.minTokenLength &&
                    !CategorizeInboxMerchantKeyService.NOISE_TOKENS.has(token)
            );

        this.tokenCache.set(title, tokens);

        return tokens;
    }
}

export const categorizeInboxMerchantKeyService = new CategorizeInboxMerchantKeyService();
