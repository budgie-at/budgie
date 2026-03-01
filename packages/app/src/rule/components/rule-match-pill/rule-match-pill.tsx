import { RuleWithRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useRuleFormModal } from '../../context/rule-form-modal.context';
import { ruleEngineService } from '../../service/rule-engine.service';
import { ruleService } from '../../service/rule.service';

const ENTRY_DELAY_MS = 500;
const PILL_ICON_SIZE = 14;

interface Props {
    readonly matchingRule: RuleWithRelationsEntityInterface;
    readonly compact?: boolean;
}

export const RuleMatchPill = ({ matchingRule, compact = false }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [anchor, setAnchor] = useState<PopoverMenuAnchor>({ x: 0, y: 0, width: 0, height: 0 });
    const triggerRef = useRef<View>(null);
    const { openRuleForm } = useRuleFormModal();

    const handlePillPress = () => {
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setIsMenuOpen(true);
        });
    };

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
    };

    const handleEditRule = () => {
        setIsMenuOpen(false);
        void openRuleForm({ ruleId: matchingRule.id });
    };

    const handleApplyToSimilar = () => {
        setIsMenuOpen(false);

        const applyRule = async () => {
            try {
                const { applied, failed } = await ruleEngineService.applyRuleToMatchingTransactions(matchingRule.id);

                if (failed === 0) {
                    Toast.show({ type: 'success', text1: t`Rule applied to ${applied} transactions` });
                } else {
                    Toast.show({ type: 'error', text1: t`${applied} updated, ${failed} failed` });
                }
            } catch (error: unknown) {
                Toast.show({ type: 'error', text1: t`Could not apply rule`, text2: getErrorMessage(error) });
            }
        };

        void applyRule();
    };

    const handleDisableRule = () => {
        setIsMenuOpen(false);

        const disableRule = async () => {
            try {
                await ruleService.toggleEnabled(matchingRule.id, false);
            } catch (error: unknown) {
                Toast.show({ type: 'error', text1: t`Could not disable rule`, text2: getErrorMessage(error) });
            }
        };

        void disableRule();
    };

    const pillContent = (
        <View ref={triggerRef} collapsable={false}>
            <HapticPressable
                onPress={handlePillPress}
                className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm"
            >
                <Icon icon={UserIconNameEnum.Workflow} size={PILL_ICON_SIZE} className="text-secondary-foreground" />
                <Text className="text-xs text-secondary-foreground font-medium">
                    <Trans>Rule active</Trans>
                </Text>
            </HapticPressable>
        </View>
    );

    const popoverMenu = (
        <PopoverMenu isOpen={isMenuOpen} onClose={handleCloseMenu} anchor={anchor}>
            <View className="py-sm">
                <PopoverMenuItem icon={UserIconNameEnum.Pencil} label={t`Edit rule`} onPress={handleEditRule} />
                <PopoverMenuItem icon={UserIconNameEnum.Play} label={t`Apply to similar`} onPress={handleApplyToSimilar} />
                <PopoverMenuItem icon={UserIconNameEnum.CircleOff} label={t`Disable rule`} onPress={handleDisableRule} />
            </View>
        </PopoverMenu>
    );

    if (compact) {
        return (
            <View className="shrink-0">
                {pillContent}
                {popoverMenu}
            </View>
        );
    }

    return (
        <View className="items-center">
            <Animated.View entering={FadeIn.delay(ENTRY_DELAY_MS).duration(200)} exiting={FadeOut.duration(200)}>
                {pillContent}
            </Animated.View>
            {popoverMenu}
        </View>
    );
};
