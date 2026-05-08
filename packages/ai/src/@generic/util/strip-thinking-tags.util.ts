export const stripThinkingTags = (text: string): string => text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gu, '').trim();
