import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { withUniwind } from 'uniwind';

import { Icon } from '../../../@generic/component/icon/icon';

const StyledSvg = withUniwind(Svg);

export const BankIntegrationAccountMenuIcon = () => (
    <View className="h-[20px] w-[20px]">
        <Icon icon={UserIconNameEnum.Ellipsis} size={20} className="text-secondary-foreground" />
        <StyledSvg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            className="absolute text-secondary-foreground"
            fill="currentColor"
            pointerEvents="none"
        >
            <Circle cx={5} cy={12} r={1.5} />
            <Circle cx={12} cy={12} r={1.5} />
            <Circle cx={19} cy={12} r={1.5} />
        </StyledSvg>
    </View>
);
