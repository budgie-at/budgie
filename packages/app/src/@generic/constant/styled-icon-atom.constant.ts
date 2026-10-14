import { ReiconIconNameEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';
import ChartBar from 'reicon-react-native/icons/ChartBar';
import Home from 'reicon-react-native/icons/Home';
import Receipt from 'reicon-react-native/icons/Receipt';
import Settings from 'reicon-react-native/icons/Settings';
import { withUniwind } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import { resolveReiconIcon } from '../utils/resolve-reicon-icon.util';

import { ICON_IMPORTS } from './icons.constant';

import type { ReiconModuleInterface } from '../interface/reicon-module.interface';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { IconComponent } from 'reicon-react-native';

const PRELOADED_ICONS: Partial<Record<ReiconIconNameEnum, IconComponent>> = {
    [ReiconIconNameEnum.HOME]: Home,
    [ReiconIconNameEnum.RECEIPT]: Receipt,
    [ReiconIconNameEnum.CHART_BAR]: ChartBar,
    [ReiconIconNameEnum.SETTINGS]: Settings
};

const reiconStyledIconAtom = Atom.family((icon: ReiconIconNameEnum) => {
    const preloadedIcon = PRELOADED_ICONS[icon];
    const iconComponent = isDefined(preloadedIcon)
        ? Effect.succeed(preloadedIcon)
        : Effect.map(
              Effect.promise<ReiconModuleInterface>(() => ICON_IMPORTS[icon]()),
              module => module.default
          );

    return Atom.make(Effect.map(iconComponent, component => withUniwind(component))).pipe(Atom.keepAlive);
});

export const styledIconAtom = (icon: UserIconNameEnum | ReiconIconNameEnum) => reiconStyledIconAtom(resolveReiconIcon(icon));
