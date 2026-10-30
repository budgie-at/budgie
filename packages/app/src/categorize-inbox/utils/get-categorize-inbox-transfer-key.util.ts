import { getCategorizeInboxJarName } from './get-categorize-inbox-jar-name.util';

export const getCategorizeInboxTransferKey = (title: string): string => getCategorizeInboxJarName(title) ?? title.trim();
