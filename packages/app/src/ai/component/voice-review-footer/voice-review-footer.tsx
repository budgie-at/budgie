import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';

const TABULAR_NUMS_STYLE = { fontVariant: ['tabular-nums' as const] };

interface Props {
    readonly count: number;
    readonly totalMicroUnits: number;
    readonly canSave: boolean;
    readonly isSaving: boolean;
    readonly onCancel: () => void;
    readonly onReRecord: () => void;
    readonly onSave: () => void;
}

export const VoiceReviewFooter = ({ count, totalMicroUnits, canSave, isSaving, onCancel, onReRecord, onSave }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const total = convertFromMicroUnits(totalMicroUnits).toFixed(0);
    const containerStyle = { paddingBottom: bottom };
    const saveLabel = plural(count, { one: 'Save # expense', other: 'Save # expenses' });
    const isSaveDisabled = !canSave || isSaving;

    return (
        <View className="border-t border-secondary-background bg-background px-lg pt-md" style={containerStyle}>
            {isPositiveNumber(count) ? (
                <View className="mb-md flex-row items-baseline justify-between">
                    <Text className="text-sm uppercase tracking-wider text-secondary-foreground">{t`Total`}</Text>
                    <Text className="text-2xl font-bold text-primary" style={TABULAR_NUMS_STYLE}>
                        {total}
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
