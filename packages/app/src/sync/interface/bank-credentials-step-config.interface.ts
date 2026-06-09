import { MessageDescriptor } from '@lingui/core';

export interface BankCredentialsStepConfigInterface {
    readonly url: string;
    readonly title: MessageDescriptor;
    readonly description: MessageDescriptor;
    readonly modalTitle: MessageDescriptor;
    readonly warningTitle: MessageDescriptor;
    readonly steps: readonly MessageDescriptor[];
}
