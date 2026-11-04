import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly onGoBack: () => void;
    readonly footerButton: ReactNode;
    readonly children: ReactNode;
}

export const EnableBankingSetupPage = ({ title, onGoBack, footerButton, children }: Props) => {
    const footer = isDefined(footerButton) ? (
        <View className="border-t-hairline border-surface-separator bg-surface px-5xl pt-lg">
            <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
            {footerButton}
        </View>
    ) : null;

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                title={title}
                leading={<GoBackButton onPress={onGoBack} />}
                scrimClassName="bg-surface"
                contentClassName="gap-y-3xl"
                footer={footer}
            >
                {children}
            </CollapsibleChromePage>
        </GroupedSurface>
    );
};
