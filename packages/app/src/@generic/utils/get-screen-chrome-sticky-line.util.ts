import { SCREEN_CHROME_TITLE_CLEARANCE } from '../constant/screen-chrome-config.constant';

export const getScreenChromeStickyLine = (listTop: number, titleBottom: number): number => {
    'worklet';

    return listTop < titleBottom ? titleBottom + SCREEN_CHROME_TITLE_CLEARANCE : listTop;
};
