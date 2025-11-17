import { isNotEmptyString, isNumber } from '@rnw-community/shared';

type EnumLike = Record<string, string | number>;

export const isEnumValue = <T extends EnumLike>(value: unknown, enumObj: T): value is T[keyof T] =>
    (isNotEmptyString(value) || isNumber(value)) && Object.values(enumObj).includes(value);
