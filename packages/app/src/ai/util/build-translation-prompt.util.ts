/* eslint-disable lingui/no-unlocalized-strings */
export const TRANSLATION_SYSTEM_PROMPT = `Translate the expense category name to English.
Return ONLY the English translation, nothing else.
Keep it short (1-3 words).

Examples:
"бухло" -> alcohol
"Дитина" -> children
"квартира" -> apartment
"їжа" -> food
"такси" -> taxi
"подарунки" -> gifts
"розваги" -> entertainment
"здоров'я" -> health`;
/* eslint-enable lingui/no-unlocalized-strings */

export const buildTranslationUserPrompt = (categoryTitle: string): string => categoryTitle;
