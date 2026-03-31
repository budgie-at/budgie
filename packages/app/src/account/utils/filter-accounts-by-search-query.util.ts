import { isNotEmptyString } from '@rnw-community/shared';

interface SearchableAccount {
    readonly title: string;
}

export const filterAccountsBySearchQuery = <T extends SearchableAccount>(accounts: T[] | null, search: string) => {
    if (!isNotEmptyString(search.trim()) || accounts === null) {
        return accounts;
    }

    const normalizedSearch = search.trim().toLowerCase();

    return accounts.filter(account => account.title.toLowerCase().includes(normalizedSearch));
};
