import type { LanguageEnum } from '../../@generic/enum/language.enum';
import type { YieldKindEnum } from '../../transaction/enum/yield-kind.enum';
import type { YieldScopeInterface } from './yield-scope.interface';

export interface YieldPayoutQueryInterface {
    readonly scope: YieldScopeInterface;
    readonly kinds: readonly YieldKindEnum[] | null;
    readonly isUnassignedOnly: boolean;
    readonly limit: number;
    readonly language: LanguageEnum;
}
