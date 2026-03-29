/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { ThumbnailGeneratorService } from './thumbnail-generator.service'

describe('ThumbnailGeneratorService', () => {
  let service: ThumbnailGeneratorService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ThumbnailGeneratorService],
    })
    service = TestBed.inject(ThumbnailGeneratorService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getYouTubeID', () => {
    it('should extract ID from youtube.com', () => {
      expect(
        (service as any).getYouTubeID(
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        )
      ).toBe('dQw4w9WgXcQ')
      expect(
        (service as any).getYouTubeID('https://youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ')
    })

    it('should extract ID from youtu.be', () => {
      expect(
        (service as any).getYouTubeID('https://youtu.be/dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ')
    })

    it('should return null for invalid URLs', () => {
      expect((service as any).getYouTubeID('https://example.com')).toBeNull()
      expect((service as any).getYouTubeID('not-a-url')).toBeNull()
    })
  })

  describe('generateImages', () => {
    it('should throw error for invalid YouTube URL', async () => {
      try {
        await new Promise((resolve, reject) => {
          service.generateImages('https://example.com').subscribe({
            next: () => reject('Should have failed'),
            error: err => {
              expect(err.message).toBe('Invalid YouTube URL')
              resolve(null)
            },
          })
        })
      } catch (e) {
        if (e === 'Should have failed') new Error(e)
      }
    })

    it('should fetch metadata and attempt to load thumbnail', async () => {
      const url = 'https://www.youtube.com/watch?v=ABC123XYZ'
      const mockMetadata = {
        title: 'Mock Video',
        author_name: 'Mock Author',
      }

      const promise = new Promise((resolve, reject) => {
        service.generateImages(url).subscribe({
          next: images => {
            expect(images.length).toBe(1)
            expect(images[0].type).toBe('basic')
            resolve(null)
          },
          error: err => {
            reject(err)
          },
        })
      })

      const req = httpMock.expectOne(r => r.url.includes('noembed.com/embed'))
      req.flush(mockMetadata)

      await promise
    })
  })
})
