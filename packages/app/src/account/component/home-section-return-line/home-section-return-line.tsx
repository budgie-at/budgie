import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { BrokerageReturnText } from '../../../brokerage/component/brokerage-return-text/brokerage-return-text';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { HoldingReturnInterface } from '../../interface/holding-return.interface';

interface Props {
    readonly sectionReturn: HoldingReturnInterface | undefined;
    readonly isLoading: boolean;
    readonly testID: string;
}

export const HomeSectionReturnLine = ({ sectionReturn, isLoading, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const percent =
        isDefined(sectionReturn) && isPositiveNumber(sectionReturn.costBasis) ? sectionReturn.gain / sectionReturn.costBasis : null;

    return (
        <View className="min-h-[18px] pl-[16px]">
            <LoadingContent isLoading={isLoading} loadingIndicator={null}>
                {isDefined(sectionReturn) ? (
                    <BrokerageReturnText
                        gain={sectionReturn.gain}
                        percent={percent}
                        instrumentSymbol={defaultInstrument.symbol}
                        testID={testID}
                    />
                ) : null}
            </LoadingContent>
        </View>
    );
};
