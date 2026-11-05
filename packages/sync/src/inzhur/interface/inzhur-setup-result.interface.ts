import type { InzhurLinkedPaymentsInterface } from './inzhur-linked-payments.interface';
import type { InzhurSetupInterface } from './inzhur-setup.interface';

export interface InzhurSetupResultInterface extends InzhurSetupInterface {
    readonly linked: InzhurLinkedPaymentsInterface;
}
