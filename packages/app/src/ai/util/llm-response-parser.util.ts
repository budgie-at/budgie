import { jsonrepair } from 'jsonrepair';

const extractBetweenBrackets = (text: string): string => {
    const startIndex = text.search(/[\\{\\[]/iu);

    const openingBracket = text[startIndex];
    const closingBracket = openingBracket === '{' ? '}' : ']';

    if (!openingBracket) {
        return '';
    }

    return text.slice(text.indexOf(openingBracket), text.lastIndexOf(closingBracket) + 1);
};

export const llmResponseParserUtil = <T extends object>(output: string) => {
    try {
        const extractedOutput = extractBetweenBrackets(output);
        const repairedOutput = jsonrepair(extractedOutput);
        const parsedJson = JSON.parse(repairedOutput) as T;

        // HINT: Sometimes model returns JSON with "properties" key
        if ('properties' in parsedJson) {
            return parsedJson.properties as T;
        }

        return parsedJson;
    } catch {
        return null;
    }
};
