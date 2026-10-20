export interface ReiconGlyphElementInterface {
    readonly tag: string;
    readonly attributes: Readonly<Record<string, string | undefined>>;
    readonly children?: readonly ReiconGlyphElementInterface[];
}
