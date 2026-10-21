import { UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { AiModelDownloadStatusEnum } from '../enum/ai-model-download-status.enum';
import { AiDownloadCardVisualInterface } from '../interface/ai-download-card-visual.interface';

export const AI_DOWNLOAD_CARD_VISUALS: Readonly<Record<AiModelDownloadStatusEnum, AiDownloadCardVisualInterface>> = {
    [AiModelDownloadStatusEnum.DISABLED]: { icon: UserIconNameEnum.Brain, variant: 'ghost', label: msg`AI off` },
    [AiModelDownloadStatusEnum.NOT_STARTED]: { icon: UserIconNameEnum.Download, variant: 'ghost', label: msg`Not downloaded` },
    [AiModelDownloadStatusEnum.DOWNLOADING]: { icon: UserIconNameEnum.Download, variant: 'pink', label: msg`Downloading` },
    [AiModelDownloadStatusEnum.PAUSED]: { icon: UserIconNameEnum.Pause, variant: 'warning', label: msg`Paused` },
    [AiModelDownloadStatusEnum.WAITING_FOR_WIFI]: { icon: UserIconNameEnum.WifiOff, variant: 'warning', label: msg`Paused: no Wi-Fi` },
    [AiModelDownloadStatusEnum.WAITING_FOR_NETWORK]: {
        icon: UserIconNameEnum.WifiOff,
        variant: 'warning',
        label: msg`Waiting for a connection`
    },
    [AiModelDownloadStatusEnum.NEEDS_SPACE]: { icon: UserIconNameEnum.HardDrive, variant: 'destructive', label: msg`Download stopped` },
    [AiModelDownloadStatusEnum.DAMAGED]: { icon: UserIconNameEnum.TriangleAlert, variant: 'destructive', label: msg`Download damaged` },
    [AiModelDownloadStatusEnum.FAILED]: { icon: UserIconNameEnum.TriangleAlert, variant: 'destructive', label: msg`Download interrupted` },
    [AiModelDownloadStatusEnum.READY]: { icon: UserIconNameEnum.CircleCheck, variant: 'positive', label: msg`Ready` }
};
