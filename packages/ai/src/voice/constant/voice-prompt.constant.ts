import { GenerateOptionsInterface } from '../../@generic/interface/generate-options.interface';

export const ITEM_EXTRACTION_PROMPT = `Extract expense items from Ukrainian, English, or mixed-language text. Return ONLY a JSON array with description, amount, and currency.

FORMAT: [{"description":"what was bought","amount":N,"currency":"XXX"}]

RULES:
- description = short phrase describing the expense (2-5 words)
- amount = number only
- currency = 3-letter code (UAH, USD, EUR) or null if not specified
- ONE amount = ONE item
- If there is no amount, return []

Examples:
"кава 50 грн" -> [{"description":"кава","amount":50,"currency":"UAH"}]
"таксі додому 120" -> [{"description":"таксі додому","amount":120,"currency":null}]
"lunch at restaurant 350 uah" -> [{"description":"lunch at restaurant","amount":350,"currency":"UAH"}]
"продукти 890, бензин 1200 грн" -> [{"description":"продукти","amount":890,"currency":null},{"description":"бензин","amount":1200,"currency":"UAH"}]
"Редактор субтитров О.Голубок" -> []`;

export const VOICE_EXTRACTION_GENERATION_OPTIONS = {
    maxNewTokens: 96,
    responseFormat: {
        jsonSchema: {
            schema: {
                items: {
                    additionalProperties: false,
                    properties: {
                        amount: { type: 'number' },
                        currency: { enum: ['UAH', 'USD', 'EUR', null] },
                        description: { type: 'string' }
                    },
                    required: ['description', 'amount', 'currency'],
                    type: 'object'
                },
                type: 'array'
            },
            strict: true
        },
        type: 'json_schema'
    },
    temperature: 0
} satisfies GenerateOptionsInterface;
