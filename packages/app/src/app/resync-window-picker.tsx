import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../@generic/component/circle-icon/circle-icon';
import { FormsheetHeader } from '../@generic/component/formsheet-header/formsheet-header';
import { HorizontalCell } from '../@generic/component/horizontal-cell/horizontal-cell';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { confirmAlert } from '../@generic/utils/confirm-alert/confirm-alert.util';
import { RESYNC_WINDOW_OPTIONS } from '../sync/constant/resync-window-options.constant';
import { useResyncWindowPickerModal } from '../sync/context/resync-window-picker-modal.context';
import { resyncBankSyncService } from '../sync/service/resync-bank-sync.service';

import type { ResyncWindowOptionInterface } from '../sync/interface/resync-window-option.interface';

const SEVEN_DAYS = 7;
const THIRTY_DAYS = 30;
const NINETY_DAYS = 90;

const getOptionLabel = (option: ResyncWindowOptionInterface, t: (strings: TemplateStringsArray) => string): string => {
    if (option.sinceDays === SEVEN_DAYS) {
        return t`Last 7 days`;
    }

    if (option.sinceDays === THIRTY_DAYS) {
        return t`Last 30 days`;
    }

    if (option.sinceDays === NINETY_DAYS) {
        return t`Last 90 days`;
    }

    return t`Re-sync entire history`;
};

const getSuccessMessage = (option: ResyncWindowOptionInterface, t: (strings: TemplateStringsArray) => string): string => {
    if (option.sinceDays === SEVEN_DAYS) {
        return t`Re-sync of last 7 days will start on next sync.`;
    }

    if (option.sinceDays === THIRTY_DAYS) {
        return t`Re-sync of last 30 days will start on next sync.`;
    }

    if (option.sinceDays === NINETY_DAYS) {
        return t`Re-sync of last 90 days will start on next sync.`;
    }

    return t`Entire history will be re-synced on next sync.`;
};

export default function ResyncWindowPickerModal() {
    const { t } = useLingui();
    const [, resolveResyncWindowPicker, currentParams] = useResyncWindowPickerModal();
    const { backgroundColor } = useFormsheetListStyles();

    const accountId = currentParams?.accountId ?? 0;
    const containerStyle = { flex: 1, backgroundColor };

    const handlePartialOptionPress = (option: ResyncWindowOptionInterface) => async () => {
        resolveResyncWindowPicker(null);

        try {
            await resyncBankSyncService.resync({ accountId, sinceDays: option.sinceDays });
            Toast.show({ type: 'success', text1: t`Bank sync reset`, text2: getSuccessMessage(option, t) });
        } catch (error: unknown) {
            Toast.show({ type: 'error', text1: t`Could not reset bank sync`, text2: getErrorMessage(error) });
        }
    };

    const handleDestructiveOptionPress = async () => {
        resolveResyncWindowPicker(null);

        const confirmed = await confirmAlert({
            title: t`Re-sync Bank Account?`,
            message: t`This will reset the sync history and re-sync all transactions from this bank account. Your existing transactions, tags, and categories will be preserved and updated with any new data.`,
            confirmText: t`Re-sync History`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        try {
            await resyncBankSyncService.resync({ accountId, sinceDays: null });
            Toast.show({ type: 'success', text1: t`Bank sync reset`, text2: t`Entire history will be re-synced on next sync.` });
        } catch (error: unknown) {
            Toast.show({ type: 'error', text1: t`Could not reset bank sync`, text2: getErrorMessage(error) });
        }
    };

    const handleOptionPress = (option: ResyncWindowOptionInterface) => {
        if (isDefined(option.sinceDays)) {
            return handlePartialOptionPress(option);
        }

        return handleDestructiveOptionPress;
    };

    return (
        <View style={containerStyle}>
            <FormsheetHeader size="md" title={t`Re-sync transactions`} description={t`Pick a window. Existing data is preserved.`} />

            <ScrollView contentContainerClassName="px-3xl gap-y-md pb-5xl" showsVerticalScrollIndicator={false}>
                {RESYNC_WINDOW_OPTIONS.map(option => {
                    const label = getOptionLabel(option, t);
                    const { isDestructive } = option;
                    const labelClassName = isDestructive
                        ? 'text-destructive-foreground text-md font-semibold'
                        : 'text-primary text-md font-semibold';
                    const iconVariant = isDestructive ? 'destructive' : 'primary';

                    return (
                        <HorizontalCell
                            key={String(option.sinceDays)}
                            onPress={handleOptionPress(option)}
                            left={<CircleIcon icon={option.icon} variant={iconVariant} size={40} iconSize={18} />}
                        >
                            <Text className={labelClassName}>{label}</Text>
                            {isDestructive ? (
                                <Text className="text-secondary-foreground text-sm">
                                    <Trans>Resets all sync state</Trans>
                                </Text>
                            ) : null}
                        </HorizontalCell>
                    );
                })}
            </ScrollView>
        </View>
    );
}
