import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly onPress: EmptyFn;
    readonly disabled?: boolean;
}

export const PinRestartButton = ({ onPress, disabled = false }: Props) => {
    const { t } = useLingui();

    return (
        <Button
            testID={PinFormSelector.RestartNewPinButton}
            accessibilityLabel={t`Choose a different PIN`}
            variant="ghost"
            leftIcon={UserIconNameEnum.RotateCcw}
            content={
                <Text maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER} className="text-primary">
                    <Trans>Choose a different PIN</Trans>
                </Text>
            }
            onPress={onPress}
            disabled={disabled}
            className="border-0 bg-transparent px-5xl py-md min-h-[44px]"
        />
    );
};
