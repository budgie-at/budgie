export const ImportColumnMapperSelector = {
    Row: (field: string) => `ImportColumnMapper.Row.${field}` as const
} as const;
