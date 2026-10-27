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
        <View className="rounded-5xl border border-secondary-corner bg-secondary-background px-5xl py-7xl items-center gap-y-3xl">
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <CircleIcon icon={UserIconNameEnum.WalletCards} variant="positive" size={64} iconSize={32} className="rounded-3xl" />
            </View>

            <View className="items-center gap-y-sm">
                <Text accessibilityRole="header" className="text-primary text-xl font-semibold text-center">
                    <Trans>Every tap, recorded</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm text-center">
                    <Trans>Budgie records Apple Pay payments the moment you tap, through a Shortcuts automation.</Trans>
                </Text>
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
                <ApplePayCaptureFlowNode icon={UserIconNameEnum.CheckCheck} label={t`Budgie`} variant="positive" />
            </View>

            <View className="self-stretch gap-y-sm">{children}</View>
        </View>
    );
};
