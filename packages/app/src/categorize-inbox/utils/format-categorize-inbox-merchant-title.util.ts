const MAX_KEPT_UPPERCASE_LETTERS = 3;

const isShoutedWord = (word: string): boolean =>
    word === word.toLocaleUpperCase() && word !== word.toLocaleLowerCase() && !/\d/u.test(word);

const capitalise = (word: string): string => word.toLocaleLowerCase().replace(/\p{L}/u, letter => letter.toLocaleUpperCase());

const countLetters = (word: string): number => word.replaceAll(/[^\p{L}]/gu, '').length;

export const formatCategorizeInboxMerchantTitle = (title: string): string =>
    title
        .split(' ')
        .map(word => (isShoutedWord(word) && countLetters(word) > MAX_KEPT_UPPERCASE_LETTERS ? capitalise(word) : word))
        .join(' ');
