import type { UserIconNameEnum } from '@budgie/contracts';

export interface InzhurCanonicalFundInterface {
    readonly isClosed?: boolean;
    readonly keyword: string;
    readonly name: string;
    readonly icon: UserIconNameEnum;
}
