const BYTES_PER_KB = 1_000;

const BYTES_PER_MB = BYTES_PER_KB * 1_000;

const BYTES_PER_GB = BYTES_PER_MB * 1_000;

export const formatModelStorageSize = (bytes: number): string => {
    if (bytes >= BYTES_PER_GB) {
        return `${(bytes / BYTES_PER_GB).toFixed(2)} GB`;
    }
    if (bytes >= BYTES_PER_MB) {
        return `${Math.round(bytes / BYTES_PER_MB)} MB`;
    }
    if (bytes >= BYTES_PER_KB) {
        return `${Math.round(bytes / BYTES_PER_KB)} KB`;
    }

    return `${bytes} B`;
};
