export const ImportColumnMapperModalSelector = {
    Header: (header: string) => `ImportColumnMapperModal.Header.${header.trim()}` as const,
    ClearSelected: 'ImportColumnMapperModal.ClearSelected',
    Done: 'ImportColumnMapperModal.Done'
} as const;
