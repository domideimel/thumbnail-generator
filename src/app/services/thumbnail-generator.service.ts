import { inject, Injectable } from '@angular/core'
import { catchError, forkJoin, map, Observable, throwError } from 'rxjs'
import { HttpClient } from '@angular/common/http'
import {
  GeneratedImage,
  YoutubeMetadataModel,
  YoutubeMetadataModelSchema,
} from '@/models'
import { DOCUMENT } from '@angular/common'
import { parse } from 'valibot'

const CONFIG = {
  FONT: 'Arial',
  COLORS: {
    BG: '#222',
    TEXT_PRIMARY: '#eee',
    TEXT_SECONDARY: '#aaa',
    HIGHLIGHT: '#f00',
    SHADOW: '#000',
    OVERLAY: 'rgba(0, 0, 0, 0.5)',
    BG_BLACK: 'rgba(0, 0, 0, 1.0)',
  },
  API_URL: 'https://noembed.com/embed',
  QUALITIES: ['maxresdefault', 'hqdefault', 'mqdefault', 'default'],
  CANVAS: {
    WIDTH_FULL: 1280,
    HEIGHT_FULL: 1450,
    WIDTH_LARGE: 1280,
    HEIGHT_LARGE: 1280,
    WIDTH_BASIC: 1280,
    HEIGHT_BASIC: 900,
    WIDTH_BLUR: 1280,
    HEIGHT_BLUR: 720,
  },
}

@Injectable({
  providedIn: 'root',
})
export class ThumbnailGeneratorService {
  private http = inject(HttpClient)
  private document = inject(DOCUMENT)

  /**
   * Main entry point to generate all image variations for a given YouTube URL.
   */
  generateImages(url: string): Observable<GeneratedImage[]> {
    const videoId = this.getYouTubeID(url)

    if (!videoId) {
      return throwError(() => new Error('Invalid YouTube URL'))
    }

    // Run metadata fetch and image load in parallel using forkJoin
    return forkJoin({
      metadata: this.getVideoMetadata(url),
      image: this.loadBestThumbnail(videoId),
    }).pipe(
      map(({ metadata, image }) => {
        const output = parse(YoutubeMetadataModelSchema, metadata, {
          message: 'Invalid video or missing metadata',
        })
        return this.drawAllImages(image, output, videoId)
      }),
      catchError(err =>
        throwError(() => new Error(`Failed to generate images: ${err.message}`))
      )
    )
  }

  // --- Data Fetching ---

  private getVideoMetadata(url: string): Observable<YoutubeMetadataModel> {
    const embedUrl = `${CONFIG.API_URL}?url=${encodeURIComponent(url)}`
    return this.http.get<YoutubeMetadataModel>(embedUrl)
  }

  // --- Image Loading (RxJS wrapped) ---

  private loadBestThumbnail(videoId: string): Observable<HTMLImageElement> {
    return this.loadThumbnailRecursive(videoId, CONFIG.QUALITIES, 0)
  }

  private loadThumbnailRecursive(
    videoId: string,
    qualities: string[],
    index: number
  ): Observable<HTMLImageElement> {
    if (index >= qualities.length) {
      return throwError(
        () => new Error('Could not load any valid thumbnail for this video.')
      )
    }

    const url = `https://i.ytimg.com/vi/${videoId}/${qualities[index]}.jpg`

    return this.loadImage(url).pipe(
      catchError(() =>
        this.loadThumbnailRecursive(videoId, qualities, index + 1)
      )
    )
  }

  private loadImage(url: string): Observable<HTMLImageElement> {
    return new Observable<HTMLImageElement>(observer => {
      const img = new Image()
      // Crucial for allowing canvas toDataURL() later without tainting the canvas
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        observer.next(img)
        observer.complete()
      }
      img.onerror = () =>
        observer.error(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  }

  // --- Logic Helpers ---

  private getYouTubeID(url: string): string | null {
    try {
      const parsed = new URL(url)
      const host = parsed.hostname.toLowerCase()
      if (host === 'youtu.be') {
        return parsed.pathname.slice(1)
      }
      const allowedYoutubeHosts = new Set(['youtube.com', 'www.youtube.com'])
      if (allowedYoutubeHosts.has(host)) {
        return parsed.searchParams.get('v')
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return null
    }
    return null
  }

  private shortUrl(videoId: string): string {
    return `https://youtu.be/${videoId}`
  }

  // --- Canvas Drawing Generators ---

  private drawAllImages(
    img: HTMLImageElement,
    data: YoutubeMetadataModel,
    videoId: string
  ): GeneratedImage[] {
    return [
      this.drawBasicImage(img, data, videoId),
      this.drawLargeImage(img, data, videoId),
      this.drawFullImage(img, data, videoId),
      this.drawBlurredImage(img, data, videoId),
    ]
  }

  private drawFullImage(
    img: HTMLImageElement,
    data: YoutubeMetadataModel,
    videoId: string
  ): GeneratedImage {
    const { canvas, ctx } = this.createCanvas(
      CONFIG.CANVAS.WIDTH_FULL,
      CONFIG.CANVAS.HEIGHT_FULL
    )

    ctx.save()
    ctx.shadowColor = CONFIG.COLORS.SHADOW
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 15
    ctx.drawImage(img, 0, (1280 - 720) / 2, 1280, 720)
    ctx.restore()

    this.drawHeadline(ctx, 'Full Video on YouTube', canvas.width / 2, 170)
    const titleLineCount = this.drawTitleAndAuthor(ctx, data, 1100)

    ctx.save()
    ctx.fillStyle = '#fff'
    ctx.font = `80px ${CONFIG.FONT}`
    ctx.textAlign = 'center'
    const urlY = 1100 + titleLineCount * 58 + 110
    ctx.fillText(this.shortUrl(videoId), canvas.width / 2, urlY)
    ctx.restore()

    return {
      type: 'full',
      filename: `${videoId}-full-image.jpg`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    }
  }

  private drawLargeImage(
    img: HTMLImageElement,
    data: YoutubeMetadataModel,
    videoId: string
  ): GeneratedImage {
    const { canvas, ctx } = this.createCanvas(
      CONFIG.CANVAS.WIDTH_LARGE,
      CONFIG.CANVAS.HEIGHT_LARGE
    )
    const imgY = (canvas.height - 720) / 2

    ctx.drawImage(img, 0, imgY, 1280, 720)
    this.drawHeadline(ctx, 'Full Video on YouTube', canvas.width / 2, 170)
    this.drawTitleAndAuthor(ctx, data, 1100)

    return {
      type: 'large',
      filename: `${videoId}-large-image.jpg`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    }
  }

  private drawBasicImage(
    img: HTMLImageElement,
    data: YoutubeMetadataModel,
    videoId: string
  ): GeneratedImage {
    const { canvas, ctx } = this.createCanvas(
      CONFIG.CANVAS.WIDTH_BASIC,
      CONFIG.CANVAS.HEIGHT_BASIC
    )

    ctx.drawImage(img, 0, 0, 1280, 720)
    this.drawTitleAndAuthor(ctx, data, 780, 1280 - 40)

    return {
      type: 'basic',
      filename: `${videoId}-basic-image.jpg`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    }
  }

  private drawBlurredImage(
    img: HTMLImageElement,
    data: YoutubeMetadataModel,
    videoId: string
  ): GeneratedImage {
    const { canvas, ctx } = this.createCanvas(
      CONFIG.CANVAS.WIDTH_BLUR,
      CONFIG.CANVAS.HEIGHT_BLUR
    )

    ctx.fillStyle = CONFIG.COLORS.BG_BLACK
    ctx.fillRect(0, 0, 1280, 720)

    ctx.save()
    ctx.filter = 'blur(10px)'
    ctx.drawImage(img, 0, 0, 1280, 720)
    ctx.restore()

    ctx.fillStyle = CONFIG.COLORS.OVERLAY
    ctx.fillRect(0, 0, 1280, 720)

    ctx.fillStyle = '#fff'
    ctx.font = `80px ${CONFIG.FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.shortUrl(videoId), 1280 / 2, 720 / 2)

    return {
      type: 'blurred',
      filename: `${videoId}-blurred-image.jpg`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
    }
  }

  // --- Canvas Primitives ---

  private createCanvas(
    width: number,
    height: number
  ): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = this.document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context from canvas')

    ctx.fillStyle = CONFIG.COLORS.BG
    ctx.fillRect(0, 0, width, height)

    return { canvas, ctx }
  }

  private drawHeadline(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    ctx.save()
    ctx.font = `110px ${CONFIG.FONT}`
    ctx.fillStyle = CONFIG.COLORS.TEXT_PRIMARY
    ctx.textAlign = 'center'
    ctx.fillText(text, x, y)

    const metrics = ctx.measureText(text)
    const padding = 50
    const radiusX = metrics.width / 2 + padding
    const radiusY = 110

    ctx.strokeStyle = CONFIG.COLORS.HIGHLIGHT
    ctx.lineWidth = 15
    ctx.beginPath()
    ctx.ellipse(x, y - 40, radiusX, radiusY, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  private drawTitleAndAuthor(
    ctx: CanvasRenderingContext2D,
    data: YoutubeMetadataModel,
    startY: number,
    maxWidth = 1240
  ): number {
    ctx.save()
    ctx.textAlign = 'left'

    // Title
    ctx.fillStyle = CONFIG.COLORS.TEXT_PRIMARY
    ctx.font = `56px ${CONFIG.FONT}`
    const lines = this.wrapText(ctx, data.title, maxWidth)
    lines.forEach((line, i) => {
      ctx.fillText(line, 20, startY + i * 56)
    })

    // Author
    ctx.fillStyle = CONFIG.COLORS.TEXT_SECONDARY
    ctx.font = `28px ${CONFIG.FONT}`
    const authorY = startY + lines.length * 58 - 20
    ctx.fillText(`YouTube: ${data.author_name}`, 20, authorY)

    ctx.restore()
    return lines.length
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''

    for (const word of words) {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line !== '') {
        lines.push(line.trim())
        line = word + ' '
      } else {
        line = testLine
      }
    }
    if (line) lines.push(line.trim())
    return lines
  }
}
