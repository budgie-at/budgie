import type { MonobankAccountApiInterface } from './monobank-account-api.interface';
import type { MonobankJarApiInterface } from './monobank-jar-api.interface';

export interface MonobankClientInfoApiInterface {
    readonly clientId: string;
    readonly name: string;
    readonly webHookUrl: string;
    readonly permissions: string;
    readonly accounts: MonobankAccountApiInterface[];
    readonly jars: MonobankJarApiInterface[];
}
