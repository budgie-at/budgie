import { ACCOUNT_TITLE_MAX_LENGTH, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Input } from '../../../@generic/component/input/input';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly params: Pick<ConvertToInstallmentModalParamsInterface, 'operatedAt' | 'accountTitle'>;
}

export const ConvertToInstallmentHeader = ({ params }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const [isEditing, setIsEditing] = useState(false);
    const lastValidTitleRef = useRef(t`Installment plan`);
    const { control } = useFormContext<ConvertToInstallmentFormValues>();

    const render = ({ field: { value, onChange, onBlur } }: UseControllerReturn<ConvertToInstallmentFormValues, 'title'>) => {
        const handleStartEditing = () => {
            lastValidTitleRef.current = value;
            setIsEditing(true);
        };

        const handleEndEditing = () => {
            if (!isNotEmptyString(value.trim())) {
                onChange(lastValidTitleRef.current);
            }
            setIsEditing(false);
        };

        return isEditing ? (
            <Input
                borderless
                autoFocus
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onEndEditing={handleEndEditing}
                multiline
                scrollEnabled={false}
                submitBehavior="blurAndSubmit"
                maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                returnKeyType="done"
                placeholder={t`Installment plan`}
                accessibilityLabel={t`Plan name`}
                className="h-auto min-h-[44px] px-0 py-xxs text-(length:--text-xl) font-semibold"
                testID={ConvertToInstallmentModalSelector.TitleInput}
            />
        ) : (
            <Pressable
                className="min-h-[44px] justify-center py-xxs active:opacity-60"
                onPress={handleStartEditing}
                accessibilityRole="button"
                accessibilityLabel={t`Rename plan, ${value}`}
            >
                <Text className="text-xl font-semibold text-primary">
                    {value} <ScaledIcon icon={UserIconNameEnum.Pencil} size={14} className="text-secondary-foreground" />
                </Text>
            </Pressable>
        );
    };

    const operatedAtLabel = formatDayAndMonthAndYear(params.operatedAt);
    const { accountTitle } = params;

    return (
        <View>
            <Controller control={control} name="title" render={render} />
            <Text className="text-sm text-secondary-foreground" numberOfLines={2}>
                {t`Pay in parts · ${operatedAtLabel} · ${accountTitle}`}
            </Text>
        </View>
    );
};
