import { ReiconIconNameEnum } from '../enum/reicon-icon-name.enum';

const REICON_ICON_NAMES = new Set<string>(Object.values(ReiconIconNameEnum));

export const isReiconIcon = (icon: string): icon is ReiconIconNameEnum => REICON_ICON_NAMES.has(icon);
