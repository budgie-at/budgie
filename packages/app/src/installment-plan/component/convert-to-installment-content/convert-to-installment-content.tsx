import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Schema from 'effect/Schema';
import { FormProvider, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { ENTRANCE_DURATION, ENTRANCE_EASING, ENTRANCE_REDUCED_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { ConvertToInstallmentFormSchema } from '../../constant/convert-to-installment-form-schema.constant';
import { useInstallmentAmountLabel } from '../../hook/use-installment-amount-label.hook';
import { useInstallmentSplit } from '../../hook/use-installment-split.hook';
import { useSheetScroll } from '../../hook/use-sheet-scroll.hook';
import { ConvertToInstallmentCreateButton } from '../convert-to-installment-create-button/convert-to-installment-create-button';
import { ConvertToInstallmentFee } from '../convert-to-installment-fee/convert-to-installment-fee';
import { ConvertToInstallmentHeader } from '../convert-to-installment-header/convert-to-installment-header';
import { ConvertToInstallmentParts } from '../convert-to-installment-parts/convert-to-installment-parts';
import { InstallmentCountPicker } from '../installment-count-picker/installment-count-picker';
import { InstallmentTimeline } from '../installment-timeline/installment-timeline';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { ConvertToInstallmentModalParamsInterface } from '../../interface/convert-to-installment-modal-params.interface';

interface Props {
    readonly params: ConvertToInstallmentModalParamsInterface;
    readonly onResolve: (accountId: number) => void;
}

const DEFAULT_INSTALLMENT_COUNT = 3;
const FIRST_PART_TITLE_PREFIX = /^Платіж\s+/u;
const ENTERING = FadeIn.duration(ENTRANCE_DURATION);
const EXITING = FadeOut.duration(ENTRANCE_REDUCED_DURATION);
const FEE_LAYOUT = LinearTransition.duration(ENTRANCE_DURATION).easing(ENTRANCE_EASING);

export const ConvertToInstallmentContent = ({ params, onResolve }: Props) => {
    const { t } = useLingui();
    const strippedTitle = params.title.replace(FIRST_PART_TITLE_PREFIX, '').trim();
    const form = useForm<ConvertToInstallmentFormValues>({
        mode: 'onChange',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(ConvertToInstallmentFormSchema)),
        defaultValues: {
            installmentCount: DEFAULT_INSTALLMENT_COUNT,
            totalAmount: null,
            feePercent: 0,
            title: isNotEmptyString(strippedTitle) ? strippedTitle : t`Installment plan`
        }
    });
    const split = useInstallmentSplit(form.control, params.amount);
    const { scrollViewProps, sheetStyle, isKeyboardVisible, isScrolled, isFeeShown, ...scrollHandlers } = useSheetScroll();
    const formatAmount = useInstallmentAmountLabel();

    const handleSelectCount = (count: number) => void form.setValue('installmentCount', count, { shouldValidate: true });

    const formattedPaid = formatAmount(params.amount, params.instrumentSymbol);
    const recoveryNote =
        split.planTotal > params.amount ? t`Raise the total or choose fewer payments` : t`Raise the total above the paid ${formattedPaid}`;

    return (
        <FormProvider {...form}>
            <LayoutAnimationConfig skipEntering>
                <View style={sheetStyle}>
                    <ScrollView
                        {...scrollViewProps}
                        className="shrink"
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                    >
                        <View className="gap-y-3xl px-3xl pt-2xl pb-7xl">
                            <ConvertToInstallmentHeader params={params} />
                            <ConvertToInstallmentParts
                                params={params}
                                split={split}
                                recoveryNote={recoveryNote}
                                onLayout={scrollHandlers.handleHeroLayout}
                            />
                            <View className="gap-y-lg">
                                <InstallmentCountPicker selectedCount={split.installmentCount} onSelect={handleSelectCount} />
                                {split.isSplittable ? (
                                    <InstallmentTimeline operatedAt={params.operatedAt} installmentCount={split.installmentCount} />
                                ) : null}
                            </View>
                            {isFeeShown ? (
                                <Animated.View
                                    className="overflow-hidden rounded-[28px]"
                                    entering={ENTERING}
                                    exiting={EXITING}
                                    layout={FEE_LAYOUT}
                                    onLayout={scrollHandlers.handleFeeLayout}
                                >
                                    <ConvertToInstallmentFee
                                        instrumentSymbol={params.instrumentSymbol}
                                        split={split}
                                        onEditingChange={scrollHandlers.handleFeeEditingChange}
                                    />
                                </Animated.View>
                            ) : null}
                        </View>
                    </ScrollView>
                    {isScrolled ? (
                        <View
                            className="absolute inset-x-0 top-0 h-[40px] bg-linear-to-b from-primary-reverse via-primary-reverse to-primary-reverse/0"
                            pointerEvents="none"
                        />
                    ) : null}
                    {isKeyboardVisible ? (
                        <View
                            className="absolute inset-x-0 bottom-0 h-[24px] bg-linear-to-b from-primary-reverse/0 to-primary-reverse"
                            pointerEvents="none"
                        />
                    ) : (
                        <ConvertToInstallmentCreateButton params={params} split={split} recoveryNote={recoveryNote} onResolve={onResolve} />
                    )}
                </View>
            </LayoutAnimationConfig>
        </FormProvider>
    );
};
