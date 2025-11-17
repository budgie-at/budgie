export const groupNumericByThousands = (value: string, separator: string): string => {
    if (value.length <= 3) {
        return value;
    }

    let result = '';
    let groupSize = 0;

    for (let index = value.length - 1; index >= 0; index -= 1) {
        result = value[index] + result;
        groupSize += 1;

        if (groupSize === 3 && index !== 0) {
            result = separator + result;
            groupSize = 0;
        }
    }

    return result;
};
