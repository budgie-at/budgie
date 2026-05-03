import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

const TABULAR_NUMS_STYLE = { fontVariant: ['tabular-nums' as const] };

interface Props {
    readonly count: number;
    readonly totalAmount: number;
    readonly currencySymbol: string;
    readonly canSave: boolean;
    readonly isSaving: boolean;
    readonly onCancel: () => void;
    readonly onReRecord: () => void;
    readonly onSave: () => void;
}

export const VoiceReviewFooter = (props: Props) => {
    const { count, totalAmount, currencySymbol, canSave, isSaving, onCancel, onReRecord, onSave } = props;
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const containerStyle = { paddingBottom: bottom };
    const saveLabel = t`Save ${count}`;
    const isSaveDisabled = !canSave || isSaving;
    const totalLabel = formatDigits(totalAmount, `${currencySymbol} `);

    return (
        <View className="border-t border-secondary-background bg-background px-lg pt-md" style={containerStyle}>
            {isPositiveNumber(count) ? (
                <View className="mb-md flex-row items-baseline justify-between">
                    <Text className="text-sm uppercase tracking-wider text-secondary-foreground">{t`Total`}</Text>
                    <Text className="text-2xl font-bold text-primary" style={TABULAR_NUMS_STYLE}>
                        {totalLabel}
                    </Text>
                </View>
            ) : null}

            <View className="flex-row gap-x-md">
                <Button variant="ghost" content={t`Cancel`} onPress={onCancel} className="flex-1" />
                <Button
                    variant="secondary"
                    leftIcon={UserIconNameEnum.RefreshCw}
                    content={t`Re-record`}
                    onPress={onReRecord}
                    className="flex-1"
                />
            </View>

            {isPositiveNumber(count) ? (
                <View className="mt-md">
                    <Button variant="cta" content={saveLabel} onPress={onSave} disabled={isSaveDisabled} isLoading={isSaving} />
                </View>
            ) : null}
        </View>
    );
};
