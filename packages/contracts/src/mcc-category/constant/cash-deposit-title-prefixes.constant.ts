import { LanguageEnum } from '../../@generic/enum/language.enum';

export const CASH_DEPOSIT_TITLE_PREFIXES: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['cash deposit', 'atm deposit', 'cash in'],
    [LanguageEnum.UK]: ['термінал', 'поповнення готівкою', 'внесення готівки', 'city24', 'ibox', 'easypay', 'cash in'],
    [LanguageEnum.DE]: ['bareinzahlung', 'einzahlung bar', 'einzahlung automat'],
    [LanguageEnum.FR]: ['versement espèces', 'versement especes', 'dépôt espèces', 'depot especes'],
    [LanguageEnum.ES]: ['ingreso en efectivo', 'ingreso efectivo', 'depósito en efectivo', 'deposito en efectivo']
};
