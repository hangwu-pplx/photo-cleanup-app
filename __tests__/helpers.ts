import { PhotoAsset, PhotoAnalysisInput } from '../types';

export function makePhoto(props: Partial<PhotoAsset> & { id: string }): PhotoAsset {
  return {
    uri: `file:///mock/${props.id}.jpg`,
    filename: props.filename ?? `${props.id}.jpg`,
    width: props.width ?? 1200,
    height: props.height ?? 1600,
    creationTime: props.creationTime ?? Date.now(),
    modificationTime: props.modificationTime ?? Date.now(),
    mediaType: 'photo',
    ...props,
  };
}

export function makeInput(props: Partial<PhotoAnalysisInput> & { asset: PhotoAsset }): PhotoAnalysisInput {
  return {
    fileSize: props.fileSize ?? 2_000_000,
    exif: props.exif,
    ...props,
  };
}
