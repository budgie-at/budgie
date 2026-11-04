import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurStatementInfoCard = () => (
    <View className="flex-row items-center gap-x-xl rounded-3xl bg-surface-row px-3xl py-xl" style={CONTINUOUS_CORNERS}>
        <CircleIcon
            icon={UserIconNameEnum.FileText}
            size={44}
            iconSize={22}
            radius={11}
            variant="ghost"
            border={false}
            className="bg-surface-disc"
            iconClassName="text-primary"
        />
        <View className="flex-1 gap-y-xxs">
            <Text className="text-[17px] font-semibold text-primary">
                <Trans>Account statement, PDF</Trans>
            </Text>
            <Text className="text-[13px] leading-[18px] text-secondary-foreground">
                <Trans>Budgie updates your certificates and cash, and records buys and dividends for you.</Trans>
            </Text>
        </View>
    </View>
);
