export const HouseholdAccountShareGroupRowSelector = {
    Row: (groupKey: string) => `HouseholdAccountShareGroupRow.Row.${groupKey}` as const,
    Switch: (groupKey: string) => `HouseholdAccountShareGroupRow.Switch.${groupKey}` as const,
    Expand: (groupKey: string) => `HouseholdAccountShareGroupRow.Expand.${groupKey}` as const
} as const;
