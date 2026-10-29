export const isCategorizeInboxAccountNameMatch = (accountTitle: string, jarName: string): boolean =>
    accountTitle.toLowerCase().includes(jarName.toLowerCase());
