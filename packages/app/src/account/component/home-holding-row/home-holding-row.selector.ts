export const HomeHoldingRowSelector = {
    Row: (instrumentCode: string) => `HomeHolding.${instrumentCode}` as const,
    Caption: (instrumentCode: string) => `HomeHolding.Caption.${instrumentCode}` as const,
    Value: (instrumentCode: string) => `HomeHolding.Value.${instrumentCode}` as const,
    Return: (instrumentCode: string) => `HomeHolding.Return.${instrumentCode}` as const
} as const;
