import { isEmojiIcon, UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import ChartBar from 'reicon-react-native/icons/ChartBar';
import HelpCircle from 'reicon-react-native/icons/HelpCircle';
import Home from 'reicon-react-native/icons/Home';
import Receipt from 'reicon-react-native/icons/Receipt';
import Settings from 'reicon-react-native/icons/Settings';
import { withUniwind } from 'uniwind';

import { emptyFn, isDefined, isNumber } from '@rnw-community/shared';

import { ICON_IMPORTS } from '../../constant/icons.constant';

import type { IconProps } from 'reicon-react-native';
import type { ApplyUniwind } from 'uniwind';

interface Props extends ApplyUniwind<IconProps> {
    readonly icon: UserIconType;
}

const STYLED_FALLBACK_ICON = withUniwind(HelpCircle);

const STYLED_ICON_CACHE = new Map<UserIconNameEnum, typeof STYLED_FALLBACK_ICON>();

const STYLED_ICON_PROMISES = new Map<UserIconNameEnum, Promise<typeof STYLED_FALLBACK_ICON>>();

STYLED_ICON_CACHE.set(UserIconNameEnum.Home, withUniwind(Home));
STYLED_ICON_CACHE.set(UserIconNameEnum.Receipt, withUniwind(Receipt));
STYLED_ICON_CACHE.set(UserIconNameEnum.ChartNoAxesColumn, withUniwind(ChartBar));
STYLED_ICON_CACHE.set(UserIconNameEnum.Settings, withUniwind(Settings));

const loadStyledIcon = (icon: UserIconNameEnum): Promise<typeof STYLED_FALLBACK_ICON> => {
    const pendingIcon = STYLED_ICON_PROMISES.get(icon);
    if (isDefined(pendingIcon)) {
        return pendingIcon;
    }

    const loadedIcon = ICON_IMPORTS[icon]().then(module => {
        const styledIcon = withUniwind(module.default);
        STYLED_ICON_CACHE.set(icon, styledIcon);

        return styledIcon;
    });

    STYLED_ICON_PROMISES.set(icon, loadedIcon);

    return loadedIcon;
};

export const Icon = ({ icon, ...rest }: Props) => {
    const [, setLoadedIcon] = useState<UserIconNameEnum | undefined>();

    useEffect(() => {
        if (isEmojiIcon(icon) || isDefined(STYLED_ICON_CACHE.get(icon))) {
            return emptyFn;
        }

        let isSubscribed = true;
        const resolveIcon = async (): Promise<void> => {
            await loadStyledIcon(icon);
            if (isSubscribed) {
                setLoadedIcon(icon);
            }
        };

        void resolveIcon().catch(emptyFn);

        return () => {
            isSubscribed = false;
        };
    }, [icon]);

    if (isEmojiIcon(icon)) {
        const emojiSize = isNumber(rest.size) ? rest.size : 24;
        const emojiStyle = { fontSize: emojiSize * 0.8, lineHeight: emojiSize, textAlign: 'center' as const };

        return (
            <Text style={emojiStyle} allowFontScaling={false}>
                {icon}
            </Text>
        );
    }

    const cachedIcon = STYLED_ICON_CACHE.get(icon);
    const IconToRender = cachedIcon ?? STYLED_FALLBACK_ICON;

    // oxlint-disable-next-line react/static-components
    return <IconToRender {...rest} />;
};
