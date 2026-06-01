export interface TestInlineShimPluginInterface {
    readonly name: string;
    readonly enforce: 'pre';
    readonly resolveId: (id: string) => string | null;
    readonly load: (id: string) => string | null;
}
