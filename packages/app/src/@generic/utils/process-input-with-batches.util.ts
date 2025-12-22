export const processInputWithBatches = async <T, O>(inputs: T[], batchSize: number, cb: (batch: T[]) => Promise<O[]>): Promise<O[]> => {
    const results: O[] = [];

    for (let index = 0; index < inputs.length; index += batchSize) {
        const batch = inputs.slice(index, index + batchSize);

        // eslint-disable-next-line no-await-in-loop
        results.push(...(await cb(batch)));
    }

    return results;
};
