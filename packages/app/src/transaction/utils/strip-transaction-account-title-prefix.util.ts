import { isNotEmptyString } from '@rnw-community/shared';

export const stripTransactionAccountTitlePrefix = (title: string | null | undefined, prefix: string | null): string | null => {
    if (!isNotEmptyString(title)) {
        return title ?? null;
    }

    if (!isNotEmptyString(prefix) || !title.toLowerCase().startsWith(prefix.toLowerCase())) {
        return title;
    }

    const suffix = title.slice(prefix.length);

    if (!/^[\s·:-]/u.test(suffix)) {
        return title;
    }

    const remainder = suffix.replace(/^[\s·:-]+/u, '').trim();

    return isNotEmptyString(remainder) ? remainder : title;
};
