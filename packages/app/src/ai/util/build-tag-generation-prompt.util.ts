/* eslint-disable lingui/no-unlocalized-strings */
export const TAG_GENERATION_SYSTEM_PROMPT = `Generate search keywords for this expense category.
Return ONLY comma-separated English words, no explanations.
Include: the word itself, synonyms, related terms, common merchants.

Examples:
"food" -> food, groceries, meals, eating, restaurant, dining, supermarket
"transport" -> transport, taxi, uber, bus, metro, ride, commute, lyft
"children" -> children, kids, baby, childcare, toys, school, daycare
"alcohol" -> alcohol, drinks, booze, liquor, beer, wine, bar, pub
"entertainment" -> entertainment, movies, games, cinema, theater, concert
"health" -> health, medical, doctor, pharmacy, hospital, medicine`;
/* eslint-enable lingui/no-unlocalized-strings */

export const buildTagGenerationUserPrompt = (titleEn: string): string => titleEn;
