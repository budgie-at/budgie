const COMBINING_MARKS = /[̀-ͯ]/gu;

export const foldSearchText = (text: string): string => text.normalize('NFD').replaceAll(COMBINING_MARKS, '').toLowerCase();
