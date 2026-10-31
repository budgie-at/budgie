import { isDefined } from '@rnw-community/shared';

import { getCategorizeInboxJarName } from './get-categorize-inbox-jar-name.util';

const MIN_TITLE_LETTERS = 3;

export const isCategorizeInboxAccountNameMatch = (accountTitle: string, clusterTitle: string): boolean => {
    const account = accountTitle.trim().toLowerCase();
    const title = clusterTitle.trim().toLowerCase();
    const jarName = getCategorizeInboxJarName(title)?.toLowerCase();
    const accountJarName = getCategorizeInboxJarName(account)?.toLowerCase();
    const letterCount = title.match(/\p{L}/gu)?.length ?? 0;

    return (
        (isDefined(jarName) && account.includes(jarName)) ||
        (letterCount >= MIN_TITLE_LETTERS && account.includes(title)) ||
        (isDefined(accountJarName) && title.includes(accountJarName))
    );
};
