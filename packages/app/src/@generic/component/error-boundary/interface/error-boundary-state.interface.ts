export interface ErrorBoundaryStateInterface {
    readonly error: Error | null;
    readonly hasError: boolean;
    readonly resetKey: string | undefined;
}
