import { SQL, sql } from 'drizzle-orm';

import { PRECISION } from '../constant/precision.constant';

export const roundToMinorUnitSql = (value: SQL) => {
    const minorUnitMicroUnits = PRECISION / 100;

    return sql<number>`(CAST(ROUND((${value}) * 1.0 / ${minorUnitMicroUnits}) AS INTEGER) * ${minorUnitMicroUnits})`;
};
