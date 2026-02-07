export const CONTEXT_TRANSLATION_SYSTEM_PROMPT = `Translate the transaction context to English. Keep the format, translate only non-English parts. Return ONLY the translated text.

Examples:
Transaction: Сільпо | Category: food -> Transaction: Silpo | Category: food
Transaction: ГУК у м.Києві | Note: 101 ЄП за 12.2025 -> Transaction: Housing office in Kyiv | Note: 101 single tax for 12.2025
Category: подарунки | Transaction: Інтернет -> Category: gifts | Transaction: Internet
Transaction: З єврового рахунку ФОП -> Transaction: From EUR business account`;
