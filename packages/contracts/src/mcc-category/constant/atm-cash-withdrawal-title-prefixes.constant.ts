import { LanguageEnum } from '../../@generic/enum/language.enum';

export const ATM_CASH_WITHDRAWAL_TITLE_PREFIXES: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['atm', 'cash withdrawal'],
    [LanguageEnum.UK]: ['банкомат', 'зняття готівки', 'видача готівки'],
    [LanguageEnum.DE]: ['bankomat', 'geldautomat', 'bargeldbehebung', 'bargeldauszahlung', 'barbehebung'],
    [LanguageEnum.FR]: ['retrait dab', 'retrait gab', 'retrait espèces', 'retrait especes'],
    [LanguageEnum.ES]: ['cajero', 'retirada de efectivo', 'retiro de efectivo', 'reintegro en cajero', 'reintegro efectivo']
};
