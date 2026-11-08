import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { useHouseholdOrganizerName } from '../../../household/hook/use-household-organizer-name.hook';
import { useHousehold } from '../../../household/hook/use-household.hook';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

export const FamilySectionHeader = () => {
    const { t } = useLingui();
    const { isMember } = useHousehold();
    const organizerName = useHouseholdOrganizerName();
    const { isAvailable } = useICloudAccount();

    const title = isMember && isNotEmptyString(organizerName) ? t`${organizerName}'s family` : t`Family`;
    const pausedStatus = isAvailable ? null : (
        <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-warning-strong">
            <Trans>Updates paused — sign in to iCloud</Trans>
        </Text>
    );

    return (
        <AccountSectionHeaderFrame
            title={title}
            total={null}
            leading={<View className="size-[8px] rounded-full bg-secondary-foreground" />}
        >
            <View className="-mt-xs gap-y-xxs pl-[14px]">
                <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
                    <Trans>Not counted in your total</Trans>
                </Text>
                {pausedStatus}
            </View>
        </AccountSectionHeaderFrame>
    );
};
