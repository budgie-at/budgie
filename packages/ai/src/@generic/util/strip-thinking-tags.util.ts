export const stripThinkingTags = (text: string): string => text.replaceAll(/<think>[\s\S]*?(?:<\/think>|$)/gu, '').trim();
