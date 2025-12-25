export const convertEnumToDrizzleEnum = (value: Record<string, string>): [string, ...string[]] =>
    Object.values(value) as [string, ...string[]];
