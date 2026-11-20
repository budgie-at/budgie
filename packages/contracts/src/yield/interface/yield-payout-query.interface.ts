import type { LanguageEnum } from '../../@generic/enum/language.enum';
import type { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import type { YieldKindEnum } from '../../transaction/enum/yield-kind.enum';
import type { YieldScopeInterface } from './yield-scope.interface';

export interface YieldPayoutQueryInterface {
    readonly scope: YieldScopeInterface;
    readonly kinds: readonly YieldKindEnum[] | null;
    readonly isUnassignedOnly: boolean;
    readonly range: DateRangeInterface;
    readonly limit: number;
    readonly language: LanguageEnum;
}
