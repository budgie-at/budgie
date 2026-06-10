export interface MonobankJarApiInterface {
    readonly id: string;
    readonly sendId: string;
    readonly title: string;
    readonly description: string;
    readonly currencyCode: number;
    readonly balance: number;
    readonly goal: number;
}
