import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { NetworkTypeEnum } from '../../../@generic/enum/network-type.enum';
import { useFormatGigabytes } from '../../../@generic/hook/use-format-gigabytes.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { AiDownloadPreflightInterface } from '../../interface/ai-download-preflight.interface';

interface Props {
    readonly preflight: AiDownloadPreflightInterface;
}

export const AiDownloadPreflightNote = ({ preflight }: Props) => {
    const { t } = useLingui();
    const formatGigabytes = useFormatGigabytes();
    const isAiWifiOnly = useSetting('isAiWifiOnly');

    const free = formatGigabytes(preflight.freeDiskBytes);
    const missing = formatGigabytes(preflight.missingBytes);
    const cellularText = isAiWifiOnly ? t`You're on mobile data. It starts when you're back on Wi-Fi.` : t`You're on mobile data.`;
    const networkTexts: Record<NetworkTypeEnum, string> = {
        [NetworkTypeEnum.WIFI]: t`You're on Wi-Fi.`,
        [NetworkTypeEnum.CELLULAR]: cellularText,
        [NetworkTypeEnum.OFFLINE]: t`You're offline. It starts when you're back online.`,
        [NetworkTypeEnum.UNKNOWN]: ''
    };
    const spaceText = preflight.hasEnoughSpace
        ? t`${free} GB free on this phone.`
        : t`This phone needs ${missing} GB more free space first.`;
    const noteText = `${spaceText} ${networkTexts[preflight.networkType]}`.trim();

    return <Text className="text-sm text-secondary-foreground">{noteText}</Text>;
};
