import { isEmojiIcon, UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
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

import type { AsyncResolvedIconInterface } from '../../interface/async-resolved-icon.interface';
import type { StyledReiconType } from '../../type/styled-reicon.type';
import type { IconComponent, IconProps } from 'reicon-react-native';
import type { ApplyUniwind } from 'uniwind';

interface Props extends ApplyUniwind<IconProps> {
    readonly icon: UserIconType;
}

const createStyledIcon = (baseIcon: IconComponent): StyledReiconType => withUniwind(baseIcon);

const STYLED_FALLBACK_ICON = createStyledIcon(HelpCircle);

const STYLED_ICON_CACHE = new Map<UserIconNameEnum, StyledReiconType>();

const STYLED_ICON_PROMISES = new Map<UserIconNameEnum, Promise<StyledReiconType>>();

STYLED_ICON_CACHE.set(UserIconNameEnum.Home, createStyledIcon(Home));
STYLED_ICON_CACHE.set(UserIconNameEnum.Receipt, createStyledIcon(Receipt));
STYLED_ICON_CACHE.set(UserIconNameEnum.ChartNoAxesColumn, createStyledIcon(ChartBar));
STYLED_ICON_CACHE.set(UserIconNameEnum.Settings, createStyledIcon(Settings));

const loadStyledIcon = (icon: UserIconNameEnum): Promise<StyledReiconType> => {
    const pendingIcon = STYLED_ICON_PROMISES.get(icon);
    if (isDefined(pendingIcon)) {
        return pendingIcon;
    }

    const iconImport = ICON_IMPORTS[icon];
    if (!isDefined(iconImport)) {
        return Promise.reject(new Error(t`Icon importer not found: ${icon}`));
    }

    const loadedIcon = iconImport().then(module => {
        const styledIcon = createStyledIcon(module.default);
        STYLED_ICON_CACHE.set(icon, styledIcon);

        return styledIcon;
    });

    STYLED_ICON_PROMISES.set(icon, loadedIcon);

    return loadedIcon;
};

export const Icon = ({ icon, ...rest }: Props) => {
    const [asyncResolvedIcon, setAsyncResolvedIcon] = useState<AsyncResolvedIconInterface | undefined>();

    useEffect(() => {
        if (isEmojiIcon(icon) || isDefined(STYLED_ICON_CACHE.get(icon)) || !isDefined(ICON_IMPORTS[icon])) {
            return emptyFn;
        }

        let isSubscribed = true;
        const resolveIcon = async (): Promise<void> => {
            const styledIcon = await loadStyledIcon(icon);
            if (isSubscribed) {
                setAsyncResolvedIcon({ icon, styledIcon });
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
    const asyncIcon = isDefined(asyncResolvedIcon) && asyncResolvedIcon.icon === icon ? asyncResolvedIcon.styledIcon : STYLED_FALLBACK_ICON;
    const IconToRender = cachedIcon ?? asyncIcon;

    // oxlint-disable-next-line react/static-components
    return <IconToRender {...rest} />;
};
