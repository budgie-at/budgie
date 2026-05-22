export interface LiveQueryInterface<TData> {
    readonly catch: Promise<TData>['catch'];
    readonly then: Promise<TData>['then'];
}
