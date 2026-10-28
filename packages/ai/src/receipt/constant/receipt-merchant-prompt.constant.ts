import type { GenerateOptionsInterface } from '../../@generic/interface/generate-options.interface';

export const RECEIPT_MERCHANT_PROMPT = `Name the merchant of a shop receipt or invoice. Return ONLY JSON: {"merchant":"...","description":"..."}

RULES:
- merchant = the brand customers know, 1-3 words, natural capitalisation, without legal form (GmbH, AG, KG, LLC, ТОВ, ФОП)
- description = what was bought, 2-5 words in the receipt language, or "" when unclear
- never output amounts, dates or card numbers

Examples:
"BILLA\nBILLA AG\nBANANEN 1,99\nVOLLMILCH 1,49" -> {"merchant":"Billa","description":"Lebensmittel"}
"IHR LABOR\nOrdinationsgemeinschaft für Labordiagnostik\nBlutbild 62,10" -> {"merchant":"Ihr Labor","description":"Blutbild"}`;

export const RECEIPT_MERCHANT_GENERATION_OPTIONS = {
    maxNewTokens: 48,
    responseFormat: {
        jsonSchema: {
            schema: {
                additionalProperties: false,
                properties: { merchant: { type: 'string' }, description: { type: 'string' } },
                required: ['merchant', 'description'],
                type: 'object'
            },
            strict: true
        },
        type: 'json_schema'
    },
    temperature: 0
} satisfies GenerateOptionsInterface;
