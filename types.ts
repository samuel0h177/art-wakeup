export interface VideoState {
  isLoading: boolean;
  progressMessage: string;
  videoUrl: string | null;
  error: string | null;
}

export enum AspectRatio {
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9'
}

export interface GenerateOptions {
  prompt: string;
  imageBase64: string;
  mimeType: string;
  aspectRatio: AspectRatio;
}