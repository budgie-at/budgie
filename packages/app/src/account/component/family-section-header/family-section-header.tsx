import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { useHouseholdOrganizerName } from '../../../household/hook/use-household-organizer-name.hook';
import { useHousehold } from '../../../household/hook/use-household.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

interface Props {
    readonly total: number | null;
}

const navigateToFamily = () => void router.push('/settings/family');
const ACCESSIBILITY_ACTIONS = [{ name: 'activate' }];

export const FamilySectionHeader = ({ total }: Props) => {
    const { t } = useLingui();
    const { isMember } = useHousehold();
    const organizerName = useHouseholdOrganizerName();
    const { isAvailable } = useICloudAccount();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();

    const title = isMember && isNotEmptyString(organizerName) ? t`${organizerName}'s family` : t`Family`;
    const accessibilityLabel = [
        title,
        t`Shared with you`,
        t`Not counted in your total`,
        isDefined(total) ? protectAmount(total, defaultInstrument.symbol) : null,
        isAvailable ? null : t`Paused, balances may be out of date. Sign in to iCloud to update`
    ]
        .filter(isDefined)
        .join(', ');
    const pausedIcon = isAvailable ? null : (
        <Icon icon={UserIconNameEnum.CloudOff} size={12} strokeWidth={2.25} className="text-warning-strong" />
    );
    const statusLine = isAvailable ? (
        <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
            <Trans>Shared with you · not in your total</Trans>
        </Text>
    ) : (
        <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
            <Trans>
                <Text className="font-semibold text-warning-strong">Paused</Text> · not in your total
            </Trans>
        </Text>
    );

    return (
        <HapticPressable
            pressedScale={1}
            accessibilityRole="header"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={t`Opens Family settings`}
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={navigateToFamily}
            onPress={navigateToFamily}
            className="active:opacity-60"
        >
            <AccountSectionHeaderFrame
                title={title}
                total={total}
                leading={<Icon icon={UserIconNameEnum.Users} size={13} strokeWidth={2.25} className="text-secondary-foreground" />}
                totalClassName="font-normal"
                titleAccessory={
                    <Icon icon={UserIconNameEnum.ChevronRight} size={14} strokeWidth={2.5} className="text-secondary-foreground" />
                }
                subtitleLeading={pausedIcon}
            >
                {statusLine}
            </AccountSectionHeaderFrame>
        </HapticPressable>
    );
};
