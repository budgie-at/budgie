import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { CollapsibleHeaderBackdrop } from '@rnw-community/react-native-screen-chrome';

import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { YieldEmptyState } from '../yield-empty-state/yield-empty-state';
import { YieldOpenPositionButton } from '../yield-open-position-button/yield-open-position-button';
import { YieldScreenList } from '../yield-screen-list/yield-screen-list';
import { YieldScreenTitle } from '../yield-screen-title/yield-screen-title';

import type { YieldScreenStateInterface } from '../../interface/yield-screen-state.interface';

interface Props {
    readonly state: YieldScreenStateInterface;
    readonly hasYield: boolean;
}

export const YieldScreenContent = ({ state, hasYield }: Props) => {
    const collapsedTitle = (
        <Text className="text-center text-lg font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
            <Trans>Passive income</Trans>
        </Text>
    );

    return (
        <YieldScreenContext value={state.screen}>
            <YieldSelectionContext value={state.selection}>
                {hasYield ? <YieldScreenList /> : <YieldEmptyState />}

                <CollapsibleHeaderBackdrop />

                <CollapsibleChromeHeader
                    leading={<HeaderBackButton />}
                    trailing={<YieldOpenPositionButton />}
                    expandedTitle={<YieldScreenTitle />}
                    expandedTitlePointerEvents="box-none"
                    collapsedTitle={collapsedTitle}
                />
            </YieldSelectionContext>
        </YieldScreenContext>
    );
};
