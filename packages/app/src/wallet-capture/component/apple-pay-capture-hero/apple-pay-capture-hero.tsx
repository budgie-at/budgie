import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ApplePayCaptureFlowArrow } from '../apple-pay-capture-flow-arrow/apple-pay-capture-flow-arrow';
import { ApplePayCaptureFlowNode } from '../apple-pay-capture-flow-node/apple-pay-capture-flow-node';

import type { PropsWithChildren } from 'react';

export const ApplePayCaptureHero = ({ children }: PropsWithChildren) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-3xl">
            <View className="flex-row items-center gap-x-xl">
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <CircleIcon
                        icon={UserIconNameEnum.WalletCards}
                        variant="secondary"
                        size={44}
                        iconSize={22}
                        radius={22}
                        border={false}
                        className="bg-surface-disc"
                    />
                </View>
                <View className="flex-1 gap-y-sm">
                    <Text accessibilityRole="header" className="text-primary text-[17px] font-semibold">
                        <Trans>Record Apple Pay purchases</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-[13px] leading-[18px]">
                        <Trans>A Shortcuts automation logs each tap for you.</Trans>
                    </Text>
                </View>
            </View>

            <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="flex-row items-start justify-center gap-x-xs"
            >
                <ApplePayCaptureFlowNode icon={UserIconNameEnum.SmartphoneNfc} label={t`Tap`} variant="ghost" />
                <ApplePayCaptureFlowArrow />
                <ApplePayCaptureFlowNode icon={UserIconNameEnum.Workflow} label={t`Shortcuts`} variant="ghost" />
                <ApplePayCaptureFlowArrow />
                <ApplePayCaptureFlowNode icon={UserIconNameEnum.CheckCheck} label={t`Budgie`} variant="ghost" />
            </View>

            <View className="self-stretch gap-y-sm">{children}</View>
        </View>
    );
};
