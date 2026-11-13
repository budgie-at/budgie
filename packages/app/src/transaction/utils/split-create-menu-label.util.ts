const LINE_COUNT = 2;

export const splitCreateMenuLabel = (label: string): string[] => {
    const words = label.split(' ');

    if (words.length < LINE_COUNT) {
        return [label];
    }

    const middle = Math.ceil(words.length / LINE_COUNT);

    return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
};
