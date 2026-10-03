const LATIN_ONLY_PATTERN = /^[\u0020-\u024F\u1E00-\u1EFF\s\d\p{P}\p{S}]+$/u;

export const containsNonLatin = (text: string): boolean => !LATIN_ONLY_PATTERN.test(text);
