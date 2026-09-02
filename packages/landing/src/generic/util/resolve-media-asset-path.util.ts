import type { MediaAssetInterface } from '../interface/media-asset.interface';

export const resolveMediaAssetPath = (asset: MediaAssetInterface): string =>
    `/media/${asset.slug}/${asset.locale}/${asset.theme}/${asset.scene}`;
