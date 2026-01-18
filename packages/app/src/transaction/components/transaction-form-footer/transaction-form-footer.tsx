import { UserIconNameEnum } from '@budgie/contracts';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly buttonText: string;
    readonly onSubmit: EmptyFn;
}

export const TransactionFormFooter = ({ variant, buttonText, onSubmit }: Props) => (
    <KeyboardStickyView>
        <Footer>
            <Button leftIcon={UserIconNameEnum.CircleCheck} onPress={onSubmit} variant={variant} className="w-full" content={buttonText} />
        </Footer>
    </KeyboardStickyView>
);
