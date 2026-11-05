export const readSyncMoveMarker = (changedColumns: readonly string[], prefix: string): string | null =>
    changedColumns.find(column => column.startsWith(prefix))?.slice(prefix.length) ?? null;
