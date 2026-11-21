declare global {
    var budgieTestDatabaseDisposers: Array<() => Promise<void>> | undefined;
}

export const registerTestDatabaseDisposer = (dispose: () => Promise<void>) => {
    globalThis.budgieTestDatabaseDisposers = [...(globalThis.budgieTestDatabaseDisposers ?? []), dispose];
};

export const disposeTestDatabases = async () => {
    const disposers = globalThis.budgieTestDatabaseDisposers ?? [];

    globalThis.budgieTestDatabaseDisposers = [];
    await Promise.all(disposers.map(dispose => dispose()));
};
