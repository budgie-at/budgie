const SINGLE_QUOTES_PATTERN = /'/gu;
const UNQUOTED_KEYS_PATTERN = /(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gu;
const TRAILING_COMMA_PATTERN = /,\s*([}\]])/gu;
const NEWLINES_PATTERN = /[\r\n]/gu;

const replaceSingleQuotes = (json: string): string => json.replace(SINGLE_QUOTES_PATTERN, '"');

const quoteUnquotedKeys = (json: string): string => json.replace(UNQUOTED_KEYS_PATTERN, '$1"$2":');

const removeTrailingCommas = (json: string): string => json.replace(TRAILING_COMMA_PATTERN, '$1');

const removeNewlines = (json: string): string => json.replace(NEWLINES_PATTERN, ' ');

export const fixJson = (malformedJson: string): string => {
    const cleaned = removeNewlines(malformedJson);
    const noSingleQuotes = replaceSingleQuotes(cleaned);
    const quotedKeys = quoteUnquotedKeys(noSingleQuotes);

    return removeTrailingCommas(quotedKeys);
};
