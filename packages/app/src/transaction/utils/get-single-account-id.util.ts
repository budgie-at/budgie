export const getSingleAccountId = (accountIds: number[] | null): number | null => (accountIds?.length === 1 ? accountIds[0] : null);
