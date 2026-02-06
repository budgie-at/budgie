export const VOICE_TRANSLATION_PROMPT = `Translate expense input to English. Keep numbers and currencies exactly as-is. Return ONLY the translation.

Examples:
кава 50 грн -> coffee 50 uah
таксі додому 120 -> taxi home 120
обід в ресторані 350 uah -> lunch at restaurant 350 uah
продукти в АТБ 890 -> groceries at ATB 890
бензин 1200 грн, мийка 150 -> gas 1200 uah, car wash 150
подарунок мамі 500 -> gift for mom 500
ліки в аптеці 230 -> medicine at pharmacy 230`;

export const ITEM_EXTRACTION_PROMPT = `Extract expense items from text. Return JSON array with description, amount, and currency.

FORMAT: [{"description":"what was bought","amount":N,"currency":"XXX"}]

RULES:
- description = short phrase describing the expense (2-5 words)
- amount = number only
- currency = 3-letter code (UAH, USD, EUR) or null if not specified
- ONE amount = ONE item

Examples:
"coffee 50 uah" -> [{"description":"coffee","amount":50,"currency":"UAH"}]
"taxi home 120" -> [{"description":"taxi home","amount":120,"currency":null}]
"lunch at restaurant 350 uah" -> [{"description":"lunch at restaurant","amount":350,"currency":"UAH"}]
"groceries 890, gas 1200 uah" -> [{"description":"groceries","amount":890,"currency":null},{"description":"gas","amount":1200,"currency":"UAH"}]
"coffee 50, taxi 120, lunch 350" -> [{"description":"coffee","amount":50,"currency":null},{"description":"taxi","amount":120,"currency":null},{"description":"lunch","amount":350,"currency":null}]`;
