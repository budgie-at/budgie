import { ImportPresetEnum } from '../enum/import-preset.enum';
import { ImportColumnMapFormValues } from '../schema/import-column-map.schema';

export const IMPORT_PRESETS: Record<ImportPresetEnum, ImportColumnMapFormValues> = {
    [ImportPresetEnum.SmartBudget]: {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        externalId: 'Порядковый номер',
        fromAccount: 'Счёт_1',
        toAccount: 'Счёт',
        category: 'Категория',
        operatedAt: 'Дата',
        comment: 'Описание',
        toAmount: 'Сумма',
        toCurrency: 'Валюта',
        // eslint-disable-next-line lingui/no-unlocalized-strings
        fromCurrency: 'Валюта 2',
        // eslint-disable-next-line lingui/no-unlocalized-strings
        fromAmount: 'Сумма 2',
        isPlanned: 'Запланировано',
        mcc: ''
    },
    [ImportPresetEnum.FinEye]: {
        category: 'category',
        comment: 'description',
        externalId: '',
        fromAccount: 'incomeAccount',
        fromAmount: 'income',
        fromCurrency: 'incomeCurrency',
        isPlanned: '',
        mcc: '',
        operatedAt: 'date',
        toAccount: 'outcomeAccount',
        toAmount: 'outcome',
        toCurrency: 'outcomeCurrency'
    },
    [ImportPresetEnum.Budgie]: {
        externalId: 'externalId',
        toAccount: 'toAccount',
        toAmount: 'toAmount',
        toCurrency: 'toCurrency',
        fromAccount: 'fromAccount',
        fromAmount: 'fromAmount',
        fromCurrency: 'fromCurrency',
        category: 'category',
        operatedAt: 'operatedAt',
        comment: 'comment',
        isPlanned: '',
        mcc: ''
    }
};
