export const getCategorizeInboxJarName = (title: string): string | null => /«([^»]+)»/u.exec(title)?.[1]?.trim() ?? null;
