export interface ToSqlQueryInterface {
    readonly toSQL: () => { readonly sql: string; readonly params: readonly unknown[] };
}
