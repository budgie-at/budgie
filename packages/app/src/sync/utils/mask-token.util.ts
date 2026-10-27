export const maskToken = (token: string): string => {
    const minimumVisibleTokenLength = 8;
    if (token.length <= minimumVisibleTokenLength) {
        return '••••••••';
    }

    return `${token.slice(0, 4)}••••${token.slice(-4)}`;
};
