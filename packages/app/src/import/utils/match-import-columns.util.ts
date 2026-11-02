import { LanguageEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { ImportColumnMapFormValues } from '@budgie/import-export';

const COLUMN_KEYWORDS: Record<LanguageEnum, Record<keyof ImportColumnMapFormValues, readonly string[]>> = {
    [LanguageEnum.EN]: {
        toAccount: ['account', 'toaccount'],
        category: ['category'],
        operatedAt: ['date', 'operatedat'],
        toAmount: ['amount', 'toamount'],
        toCurrency: ['currency', 'tocurrency'],
        externalId: ['id', 'externalid'],
        fromAccount: ['fromaccount'],
        fromCurrency: ['fromcurrency'],
        fromAmount: ['fromamount'],
        comment: ['comment', 'description', 'memo', 'note'],
        mcc: ['mcc']
    },
    [LanguageEnum.DE]: {
        toAccount: ['konto', 'zielkonto'],
        category: ['kategorie'],
        operatedAt: ['datum', 'buchungsdatum'],
        toAmount: ['betrag', 'zielbetrag'],
        toCurrency: ['währung', 'zielwährung'],
        externalId: ['id', 'externeid'],
        fromAccount: ['quellkonto', 'vonkonto'],
        fromCurrency: ['quellwährung'],
        fromAmount: ['quellbetrag'],
        comment: ['kommentar', 'beschreibung', 'notiz', 'verwendungszweck'],
        mcc: ['mcc']
    },
    [LanguageEnum.ES]: {
        toAccount: ['cuenta', 'cuentadestino'],
        category: ['categoría'],
        operatedAt: ['fecha', 'fechaoperación'],
        toAmount: ['importe', 'monto', 'importedestino'],
        toCurrency: ['moneda', 'monedadestino'],
        externalId: ['id', 'idexterno'],
        fromAccount: ['cuentaorigen'],
        fromCurrency: ['monedaorigen'],
        fromAmount: ['importeorigen'],
        comment: ['comentario', 'descripción', 'nota', 'concepto'],
        mcc: ['mcc']
    },
    [LanguageEnum.FR]: {
        toAccount: ['compte', 'comptedestinataire'],
        category: ['catégorie'],
        operatedAt: ['date', 'dateopération'],
        toAmount: ['montant', 'montantdestinataire'],
        toCurrency: ['devise', 'devisedestinataire'],
        externalId: ['id', 'idexterne'],
        fromAccount: ['comptesource'],
        fromCurrency: ['devisesource'],
        fromAmount: ['montantsource'],
        comment: ['commentaire', 'description', 'note', 'libellé'],
        mcc: ['mcc']
    },
    [LanguageEnum.UK]: {
        toAccount: ['рахунок', 'рахунокотримувача'],
        category: ['категорія'],
        operatedAt: ['дата', 'датаоперації'],
        toAmount: ['сума', 'сумаотримувача'],
        toCurrency: ['валюта', 'валютаотримувача'],
        externalId: ['id', 'зовнішнійid', 'ідентифікатор'],
        fromAccount: ['рахуноквідправника'],
        fromCurrency: ['валютавідправника'],
        fromAmount: ['сумавідправника'],
        comment: ['коментар', 'опис', 'примітка', 'призначення'],
        mcc: ['mcc']
    }
};

export const matchImportColumns = (headers: readonly string[]): ImportColumnMapFormValues => {
    const columnMap: ImportColumnMapFormValues = {
        toAccount: '',
        category: '',
        operatedAt: '',
        toAmount: '',
        toCurrency: '',
        externalId: '',
        fromAccount: '',
        fromCurrency: '',
        fromAmount: '',
        comment: '',
        mcc: ''
    };
    const usedHeaders = new Set<string>();

    for (const field of [
        'toAccount',
        'category',
        'operatedAt',
        'toAmount',
        'toCurrency',
        'externalId',
        'fromAccount',
        'fromCurrency',
        'fromAmount',
        'comment',
        'mcc'
    ] as const) {
        const keywords = Object.values(COLUMN_KEYWORDS).flatMap(language => language[field]);
        const header = headers.find(
            candidate =>
                !usedHeaders.has(candidate) &&
                keywords.some(
                    keyword =>
                        candidate.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, '') ===
                        keyword.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, '')
                )
        );

        if (isDefined(header)) {
            columnMap[field] = header;
            usedHeaders.add(header);
        }
    }

    return columnMap;
};
