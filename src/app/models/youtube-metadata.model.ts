import { InferOutput, number, object, string } from 'valibot'

export interface GeneratedImage {
  filename: string
  dataUrl: string
  type: 'full' | 'large' | 'basic' | 'blurred'
}

export const YoutubeMetadataModelSchema = object({
  provider_url: string(),
  thumbnail_height: number(),
  thumbnail_width: number(),
  html: string(),
  thumbnail_url: string(),
  width: number(),
  url: string(),
  version: string(),
  type: string(),
  title: string(),
  author_name: string(),
  provider_name: string(),
  height: number(),
  author_url: string(),
})

export type YoutubeMetadataModel = InferOutput<
  typeof YoutubeMetadataModelSchema
>
