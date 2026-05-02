import { isNotEmptyString } from '@rnw-community/shared';

const DIGIT_PATTERN = /\d/u;

const NUMBER_WORD_PATTERNS = [
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b/iu,
    /\b(один|одна|два|дві|три|чотири|п'ять|пʼять|шість|сім|вісім|дев'ять|девʼять|десять|двадцять|тридцять|сорок|п'ятдесят|пʼятдесят|шістдесят|сімдесят|вісімдесят|дев'яносто|девʼяносто|сто|тисяча)\b/iu
];

export const hasVoiceAmountSignal = (text: string): boolean => {
    if (!isNotEmptyString(text)) {
        return false;
    }

    if (DIGIT_PATTERN.test(text)) {
        return true;
    }

    return NUMBER_WORD_PATTERNS.some(pattern => pattern.test(text));
};
