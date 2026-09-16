// Values below are validated against the #561 dataset only: window stays tight (~1h) so off-rate simultaneous pairs cannot slip through; the 10% heuristic tolerance and the tighter 2%/500-unit authoritative bounds need re-validation against more accounts/currencies before widening (see #562).
import { PRECISION } from '@budgie/contracts';

const P2P_FIAT_TRANSFER_TIME_WINDOW_MINUTES = 60;

export const TRANSFER_PAIR_P2P_FIAT_TIME_WINDOW_SECONDS = P2P_FIAT_TRANSFER_TIME_WINDOW_MINUTES * 60;

export const TRANSFER_PAIR_P2P_FIAT_RATE_TOLERANCE = 0.1;

export const TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA_RATIO = 0.02;

export const TRANSFER_PAIR_P2P_FIAT_AUTHORITATIVE_MAX_DELTA = 500 * PRECISION;

export const P2P_ORDER_EXTERNAL_ID_MARKER = ':c2c:';
