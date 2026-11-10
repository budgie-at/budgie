import { isNumber, isString } from '@rnw-community/shared';

import type { ScopedSqlType } from '../type/scoped-sql.type';

export const scopedSql =
    (strings: TemplateStringsArray, ...values: readonly (number | string | ScopedSqlType)[]): ScopedSqlType =>
    scope =>
        values.reduce<string>(
            (sql, value, index) => `${sql}${isString(value) || isNumber(value) ? value : value(scope)}${strings[index + 1]}`,
            strings[0]
        );
