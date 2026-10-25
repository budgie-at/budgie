export const convertEnumToDrizzleEnum = (value: Record<string, string>): [string, ...string[]] => {
    const [firstValue, ...remainingValues] = Object.values(value);

    return [firstValue, ...remainingValues];
};
