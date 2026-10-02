import { LanguageEnum } from '../../@generic/enum/language.enum';

export interface RecurringChargeCandidateQueryInterface {
    readonly defaultInstrumentId: number;
    readonly language: LanguageEnum;
    readonly since: Date;
}
