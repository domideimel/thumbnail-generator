import { minLength, nonEmpty, object, pipe, regex, string, url } from 'valibot'

const YoutubeSchema = pipe(
  string(),
  regex(
    /^https:\/\/(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+$/,
    'Invalid YouTube URL. Use https://www.youtube.com/watch?v=... or https://youtu.be/...'
  )
)

const UrlSchema = pipe(
  string(),
  nonEmpty('Please enter your url.'),
  url('The url is badly formatted.'),
  minLength(10, 'URL must be at least 10 characters long.'),
)

export const UrlFormSchema = object({
  url: pipe(UrlSchema, YoutubeSchema)
})
