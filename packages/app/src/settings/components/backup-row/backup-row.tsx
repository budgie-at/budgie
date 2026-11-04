import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { isThisYear } from 'date-fns';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useBackupActions } from '../../../export/hook/use-backup-actions.hook';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingsPillButton } from '../settings-pill-button/settings-pill-button';
import { SettingsRow } from '../settings-row/settings-row';

export const BackupRow = () => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const lastBackupAt = useSetting('lastBackupAt');
    const { isLoading, handleBackup, handleShare } = useBackupActions();

    const hasBackup = isDefined(lastBackupAt);
    const isBackupThisYear = hasBackup && isThisYear(lastBackupAt);
    const lastBackupDate = hasBackup
        ? intl.formatDate(lastBackupAt, {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
              ...(!isBackupThisYear && { year: 'numeric' })
          })
        : '';
    const lastBackupLabel = hasBackup ? t`Last saved ${lastBackupDate}` : t`Not saved yet`;
    const lastBackupClassName = hasBackup ? 'text-secondary-foreground' : 'text-warning-foreground';
    const discVariant = hasBackup ? 'ghost' : 'warning';
    const buttonVariant = hasBackup ? 'secondary' : 'cta';

    return (
        <SettingsRow
            icon={UserIconNameEnum.HardDriveUpload}
            variant={discVariant}
            title={t`Backup`}
            testID={SettingsPageSelector.DataBackup}
            subtitle={
                <View className="gap-y-xs">
                    <Text className={cn('text-[13px] leading-[18px]', lastBackupClassName)} numberOfLines={2}>
                        {lastBackupLabel}
                    </Text>
                    <HapticPressable
                        onPress={handleShare}
                        disabled={isLoading}
                        accessibilityRole="button"
                        testID={SettingsPageSelector.DataBackupShareButton}
                    >
                        <Text className="text-[13px] leading-[18px] text-primary">
                            <Trans>Send a copy</Trans>
                        </Text>
                    </HapticPressable>
                </View>
            }
            right={
                <SettingsPillButton
                    label={t`Back up`}
                    onPress={handleBackup}
                    variant={buttonVariant}
                    isLoading={isLoading}
                    testID={SettingsPageSelector.DataBackupButton}
                />
            }
        />
    );
};
