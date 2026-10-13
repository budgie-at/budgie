export interface ModalRequestInterface<TParams, TResult> {
    readonly params: TParams | null;
    readonly onResult?: (result: TResult) => void;
}
