export const typedObjectKeys = <T extends object>(obj: T): Array<keyof T> => Object.keys(obj) as Array<keyof T>;
