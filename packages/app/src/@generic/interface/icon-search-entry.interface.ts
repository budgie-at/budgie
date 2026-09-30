import type { UserIconType } from '@budgie/contracts';

export interface IconSearchEntryInterface {
    readonly icon: UserIconType;
    readonly label: string;
    readonly name: string;
    readonly keywords: string;
}
