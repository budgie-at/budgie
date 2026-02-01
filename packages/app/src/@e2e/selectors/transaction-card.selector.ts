/* eslint-disable lingui/no-unlocalized-strings */
export const TransactionCardSelectors = {
    Card: (index: number) => `TransactionList.Card.${index}`,
    Title: (index: number) => `TransactionList.Card.${index}.Title`,
    CategoryBadge: (index: number) => `TransactionList.Card.${index}.CategoryBadge`,
    Tag: (index: number) => `TransactionList.Card.${index}.Tag`
} as const;
