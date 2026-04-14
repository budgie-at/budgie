export const InactiveAccountCardSelectors = {
    Card: (title: string) => `InactiveAccountCard.${title}` as const,
    ActivateButton: (title: string) => `InactiveAccountCard.ActivateButton.${title}` as const
} as const;
