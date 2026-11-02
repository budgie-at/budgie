import { useWindowDimensions, View } from 'react-native';

import { CATEGORIZE_INBOX_STACKED_FONT_SCALE } from '../../constant/categorize-inbox-stacked-font-scale.constant';
import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowGhost } from '../categorize-inbox-group-row-ghost/categorize-inbox-group-row-ghost';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'rows' | 'totalBaseAmount'>;
    readonly children: ReactNode;
}

export const CategorizeInboxGroupRowColumnsOverlay = ({ cluster, children }: Props) => {
    const { fontScale } = useWindowDimensions();

    const className =
        fontScale >= CATEGORIZE_INBOX_STACKED_FONT_SCALE
            ? 'absolute inset-0 items-end justify-end px-3xl py-xl'
            : 'absolute inset-0 items-end justify-center px-3xl py-xl';

    return (
        <View className={className} pointerEvents="box-none">
            <View className="-mx-[8px] -mb-[8px] items-end gap-y-[6px] px-[8px] pb-[8px]" pointerEvents="box-none">
                <CategorizeInboxGroupRowGhost>
                    <CategorizeInboxGroupRowAmount cluster={cluster} />
                </CategorizeInboxGroupRowGhost>
                {children}
            </View>
        </View>
    );
};
