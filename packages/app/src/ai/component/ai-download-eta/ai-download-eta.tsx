import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { NetworkTypeEnum } from '../../../@generic/enum/network-type.enum';
import { useNetworkType } from '../../../@generic/hook/use-network-type.hook';

const SECONDS_PER_MINUTE = 60;

interface Props {
    readonly etaSeconds: number | null;
}

export const AiDownloadEta = ({ etaSeconds }: Props) => {
    const { t } = useLingui();
    const networkType = useNetworkType();

    const minutesLeft = Math.max(1, Math.ceil((etaSeconds ?? 0) / SECONDS_PER_MINUTE));
    const onWifiText = t({ message: plural(minutesLeft, { one: 'About # minute left on Wi-Fi', other: 'About # minutes left on Wi-Fi' }) });
    const anyNetworkText = t({ message: plural(minutesLeft, { one: 'About # minute left', other: 'About # minutes left' }) });
    const estimateText = networkType === NetworkTypeEnum.WIFI ? onWifiText : anyNetworkText;
    const etaText = isDefined(etaSeconds) ? estimateText : t`Working out the time left…`;

    return <Text className="text-sm text-secondary-foreground">{etaText}</Text>;
};
