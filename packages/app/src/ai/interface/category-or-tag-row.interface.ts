export interface CategoryOrTagRowInterface {
    readonly kind: 'category' | 'tag';
    readonly id: number;
    readonly title: string;
}
