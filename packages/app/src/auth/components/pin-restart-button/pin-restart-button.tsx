import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
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
            variant="ghost"
            leftIcon={UserIconNameEnum.RotateCcw}
            content={t`Choose a different PIN`}
            onPress={onPress}
            disabled={disabled}
            className="border-0 bg-transparent px-5xl py-md min-h-[44px]"
        />
    );
};
