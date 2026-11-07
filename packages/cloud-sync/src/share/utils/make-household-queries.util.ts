import { Db } from '@budgie/contracts';

export const makeHouseholdQueries = () => {
    const select = <T extends object>(sqlText: string, params: readonly (string | number)[] = []) =>
        Db.query(db => db.$client.unsafe<T>(sqlText, [...params]));

    const execute = (tables: readonly string[], sqlText: string, params: readonly (string | number | null)[] = []) =>
        Db.mutation(
            { type: 'update', tables: [...tables] },
            Db.query(db => db.$client.unsafe(sqlText, [...params]))
        );

    return { select, execute };
};
