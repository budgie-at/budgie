export interface DbMutationInterface {
    readonly type: 'insert' | 'update' | 'delete';
    readonly tables: ReadonlyArray<string>;
}
