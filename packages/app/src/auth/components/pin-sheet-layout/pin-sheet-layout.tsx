import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { OnboardingStepIntro } from '../../../onboarding/component/onboarding-step-intro/onboarding-step-intro';

interface Props {
    readonly testID: string;
    readonly iconVariant: ColorPaletteVariant;
    readonly title: string;
    readonly description: string;
    readonly children: ReactNode;
}

export const PinSheetLayout = ({ testID, iconVariant, title, description, children }: Props) => (
    <View testID={testID} collapsable={false} className="flex-1 bg-primary-reverse px-5xl pt-7xl pb-safe-or-[16px] gap-y-3xl">
        <OnboardingStepIntro icon={UserIconNameEnum.KeyRound} iconVariant={iconVariant} title={title} description={description} />

        {children}
    </View>
);
