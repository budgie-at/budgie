/* oxlint-disable lingui/no-unlocalized-strings */

export const getCurrentYear = async (): Promise<number> => {
    'use cache';

    return new Date().getFullYear();
};
