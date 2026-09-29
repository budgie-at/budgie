export type CategorizeInboxEnqueueWriteType = (write: () => Promise<void>, rollback: () => void, failedMessage: string) => void;
