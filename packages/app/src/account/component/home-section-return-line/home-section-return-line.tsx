import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { HomeTodayChangeText } from '../home-today-change-text/home-today-change-text';

import type { PortfolioReturnInterface } from '../../../brokerage/interface/portfolio-return.interface';

const PLACEHOLDER_PERCENT = 0.9999;

interface Props {
    readonly sectionReturn: Pick<PortfolioReturnInterface, 'gain' | 'percent'> | undefined;
    readonly todayReturn: Pick<PortfolioReturnInterface, 'gain' | 'percent'> | undefined;
    readonly isLoading: boolean;
    readonly placeholderGain: number;
    readonly testID: string;
}

export const HomeSectionReturnLine = ({ sectionReturn, todayReturn, isLoading, placeholderGain, testID }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const percent = isDefined(sectionReturn) ? sectionReturn.percent : PLACEHOLDER_PERCENT;
    const isToday = !isDefined(sectionReturn) && isDefined(todayReturn);
    const isPending = isLoading && !isDefined(sectionReturn) && !isToday;
    const isEmpty = !isPending && !isDefined(sectionReturn) && !isToday;
    const importantForAccessibility = isEmpty ? 'no-hide-descendants' : 'auto';

    return (
        <View
            className={cn('pb-md pl-[16px]', isEmpty && 'opacity-0')}
            accessibilityElementsHidden={isEmpty}
            importantForAccessibility={importantForAccessibility}
        >
            <LoadingContent isLoading={isPending} loadingIndicator={null}>
                {isToday ? (
                    <HomeTodayChangeText
                        gain={todayReturn.gain}
                        percent={todayReturn.percent}
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        testID={testID}
                    />
                ) : (
                    <BrokerageReturnText
                        gain={sectionReturn?.gain ?? placeholderGain}
                        percent={percent}
                        instrumentSymbol={defaultInstrument.symbol}
                        period={t`total`}
                        maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        testID={testID}
                    />
                )}
            </LoadingContent>
        </View>
    );
};
