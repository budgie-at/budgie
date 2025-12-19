import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

const wordToNumber: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
    million: 1000000
};

const numberWordPattern =
    /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)(\s+|-?(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million))*\b/giu;

const digitPattern = /\d+(?:[.,]\d+)?/gu;

const processNumberWord = (acc: { result: number; current: number }, value: number): { result: number; current: number } => {
    if (value === 100) {
        return { result: acc.result, current: acc.current === 0 ? 100 : acc.current * 100 };
    }

    if (value >= 1000) {
        const newCurrent = (acc.current === 0 ? 1 : acc.current) * value;

        return { result: acc.result + newCurrent, current: 0 };
    }

    return { result: acc.result, current: acc.current + value };
};

const parseNumberWord = (text: string): number => {
    const words = text.toLowerCase().split(/[\s-]+/u);
    const validValues = words.filter(word => Object.hasOwn(wordToNumber, word)).map(word => wordToNumber[word]);
    const { result, current } = validValues.reduce(processNumberWord, { result: 0, current: 0 });

    return result + current;
};

const parseDigit = (text: string): number => parseFloat(text.replace(',', '.'));

export const parseNumberFromMessage = (message: string): number => {
    const wordMatches = message.match(numberWordPattern);
    const digitMatches = message.match(digitPattern);

    // eslint-disable-next-line no-undefined
    const wordNumber = wordMatches?.[0] ? parseNumberWord(wordMatches[0]) : undefined;
    // eslint-disable-next-line no-undefined
    const digitNumber = digitMatches?.[0] ? parseDigit(digitMatches[0]) : undefined;

    return convertToMicroUnits(wordNumber ?? digitNumber ?? 0);
};
