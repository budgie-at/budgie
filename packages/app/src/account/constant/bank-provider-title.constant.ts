import { ExternalSourceEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const BANK_PROVIDER_TITLE: Partial<Record<ExternalSourceEnum, MessageDescriptor>> = {
    [ExternalSourceEnum.ERSTE]: msg`Erste`,
    [ExternalSourceEnum.MONOBANK]: msg`Monobank`,
    [ExternalSourceEnum.PRIVATBANK]: msg`PrivatBank`
};
