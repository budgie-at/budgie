import { useState } from 'react';
import { View } from 'react-native';

import { ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { TransactionInfoEditButton } from '../transaction-info-edit-button/transaction-info-edit-button';
import { TransactionInfoNavTitle } from '../transaction-info-nav-title/transaction-info-nav-title';

import type { TransactionInfoHandoffInterface } from '../../interface/transaction-info-handoff.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { Href } from 'expo-router';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly editHref: Href | null;
    readonly handoff: TransactionInfoHandoffInterface;
    readonly compactTitle?: string;
    readonly compactAmount?: string;
    readonly onGoBack: () => void;
}

const DEFAULT_CONTROL_WIDTH = 44;

export const TransactionInfoHeader = (props: Props) => {
    const { transaction, editHref, handoff, onGoBack, compactTitle, compactAmount } = props;
    const [leadingWidth, setLeadingWidth] = useState(DEFAULT_CONTROL_WIDTH);
    const [trailingWidth, setTrailingWidth] = useState(DEFAULT_CONTROL_WIDTH);
    const handleLeadingLayout = (event: LayoutChangeEvent) => void setLeadingWidth(event.nativeEvent.layout.width);
    const handleTrailingLayout = (event: LayoutChangeEvent) => void setTrailingWidth(event.nativeEvent.layout.width);
    const horizontalInset = Math.max(leadingWidth, trailingWidth) + 32;

    return (
        <>
            <TransactionInfoNavTitle
                transaction={transaction}
                handoff={handoff}
                horizontalInset={horizontalInset}
                compactTitle={compactTitle}
                compactAmount={compactAmount}
            />
            <ScreenChromeHeader>
                <View onLayout={handleLeadingLayout}>
                    <GoBackButton onPress={onGoBack} />
                </View>
                <View onLayout={handleTrailingLayout}>
                    <TransactionInfoEditButton editHref={editHref} />
                </View>
            </ScreenChromeHeader>
        </>
    );
};
