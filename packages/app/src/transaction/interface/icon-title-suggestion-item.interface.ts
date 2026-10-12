import type { UserIconType } from '@budgie/contracts';

export interface IconTitleSuggestionItemInterface {
    readonly key: string | number;
    readonly icon: UserIconType;
    readonly title: string;
    readonly onSelect: () => void;
}
