import { MessageDescriptor } from '@lingui/core';

import type { UserIconNameEnum } from '@budgie/contracts';

export interface AiDownloadCardVisualInterface {
    readonly icon: UserIconNameEnum;
    readonly label: MessageDescriptor;
}
