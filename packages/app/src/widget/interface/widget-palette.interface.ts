import type { WidgetThemeColorsInterface } from './widget-theme-colors.interface';

export interface WidgetPaletteInterface {
    readonly light: WidgetThemeColorsInterface;
    readonly dark: WidgetThemeColorsInterface;
}
