export const abbreviateNumber = (number: number, decPlaces: number): string => {
    if (number < 1000) {
        const scale = 10 ** decPlaces;
        const fixed = Math.round(number * scale) / scale;

        return fixed.toString();
    }

    const scale = 10 ** decPlaces;
    const abbrev = ['k', 'm', 'b', 't'];

    let index = abbrev.length - 1;
    while (index >= 0) {
        const size = 10 ** ((index + 1) * 3);

        if (size <= number) {
            const value = Math.round((number * scale) / size) / scale;

            if (value === 1000 && index < abbrev.length - 1) {
                return `1${abbrev[index + 1]}`;
            }

            return `${value}${abbrev[index]}`;
        }

        index -= 1;
    }

    return `${number}`;
};
