import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { cn } from '../../../@generic/utils/cn.util';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { PortfolioReturnInterface } from '../../../brokerage/interface/portfolio-return.interface';

interface Props {
    readonly sectionReturn: Pick<PortfolioReturnInterface, 'gain' | 'percent'> | undefined;
    readonly isLoading: boolean;
    readonly testID: string;
}

export const HomeSectionReturnLine = ({ sectionReturn, isLoading, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const isEmpty = !isLoading && !isDefined(sectionReturn);
    const importantForAccessibility = isEmpty ? 'no-hide-descendants' : 'auto';

    return (
        <View
            className={cn('pl-[16px]', isEmpty && 'opacity-0')}
            accessibilityElementsHidden={isEmpty}
            importantForAccessibility={importantForAccessibility}
        >
            <LoadingContent isLoading={isLoading} loadingIndicator={null}>
                <BrokerageReturnText
                    gain={sectionReturn?.gain ?? 0}
                    percent={sectionReturn?.percent ?? null}
                    instrumentSymbol={defaultInstrument.symbol}
                    testID={testID}
                />
            </LoadingContent>
        </View>
    );
};
