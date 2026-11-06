import type { ScreenChromeStickyHeaderInterface } from './screen-chrome-sticky-header.interface';

export interface ScreenChromeStickyHeaderSourceInterface {
    readonly headers: readonly ScreenChromeStickyHeaderInterface[];
    readonly horizontalInset: number;
}
