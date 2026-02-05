import { UserIconNameEnum } from '@budgie/contracts';
import { Ref } from 'react';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { Button } from '../button/button';
import { Footer } from '../footer/footer';

interface Props {
    readonly ref: Ref<BottomSheetInterface | null>;
    readonly isLoading: boolean;
    readonly variant: ColorPaletteVariant;
    readonly description: string;
    readonly buttonText: string;
    readonly onSubmit: () => void;
    readonly icon: UserIconNameEnum;
    readonly title: string;
}

export const ConfirmActionBottomSheet = (props: Props) => {
    const { ref, isLoading, variant, description, buttonText, onSubmit, icon, title } = props;

    return (
        <BottomSheet ref={ref} enableDynamicSizing>
            <BottomSheetView>
                <BottomSheetHeader size="md" title={title} icon={icon} description={description} />
                <Footer>
                    <Button variant={variant} content={buttonText} isLoading={isLoading} onPress={onSubmit} />
                </Footer>
            </BottomSheetView>
        </BottomSheet>
    );
};
