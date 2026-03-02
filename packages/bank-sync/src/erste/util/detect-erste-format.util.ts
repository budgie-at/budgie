import { ERSTE_MODERN_FORMAT_MARKER } from '../constant/erste.constant';
import { ErsteFormatEnum } from '../enum/erste-format.enum';

export const detectErsteFormat = (text: string): ErsteFormatEnum =>
    text.includes(ERSTE_MODERN_FORMAT_MARKER) ? ErsteFormatEnum.Modern : ErsteFormatEnum.Classic;
