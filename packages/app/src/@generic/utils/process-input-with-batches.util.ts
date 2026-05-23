import { microPause } from './micro-pause.util';

export const processInputWithBatches = async <T, O>(inputs: T[], batchSize: number, cb: (batch: T[]) => Promise<O[]>): Promise<O[]> => {
    const results: O[] = [];

    for (let index = 0; index < inputs.length; index += batchSize) {
        const batch = inputs.slice(index, index + batchSize);
        const hasMoreBatches = index + batchSize < inputs.length;

        // eslint-disable-next-line no-await-in-loop
        await cb(batch).then(batchResults => {
            results.push(...batchResults);
            if (hasMoreBatches) {
                return microPause();
            }

            return null;
        });
    }

    return results;
};
