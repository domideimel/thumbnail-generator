/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Generator } from './generator'
import { ThumbnailGeneratorService } from '@/services/thumbnail-generator.service'
import { of, throwError } from 'rxjs'
import { provideRouter } from '@angular/router'

describe('Generator', () => {
  let component: Generator
  let fixture: ComponentFixture<Generator>
  let thumbnailServiceMock: any

  beforeEach(async () => {
    thumbnailServiceMock = {
      generateImages: vi.fn(),
    }

    await TestBed.configureTestingModule({
      imports: [Generator],
      providers: [
        { provide: ThumbnailGeneratorService, useValue: thumbnailServiceMock },
        provideRouter([]),
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(Generator)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should handle form submission successfully', async () => {
    const mockImages = [
      { type: 'basic', filename: 'test.jpg', dataUrl: 'data:...' },
    ]
    thumbnailServiceMock.generateImages.mockReturnValue(of(mockImages))

    // Set form value
    ;(component as any).formSchema.update((s: any) => ({
      ...s,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }))
    component.urlForm.url().markAsDirty()

    const event = new Event('submit')
    await component.onSubmit(event)

    expect(thumbnailServiceMock.generateImages).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    )
    expect(component.generatedImages()).toEqual(mockImages)
    expect(component.isLoading()).toBe(false)
  })

  it('should handle form submission error', async () => {
    thumbnailServiceMock.generateImages.mockReturnValue(
      throwError(() => new Error('API Error'))
    )
    ;(component as any).formSchema.update((s: any) => ({
      ...s,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }))
    component.urlForm.url().markAsDirty()

    const event = new Event('submit')
    await component.onSubmit(event)

    expect(component.errorMessage()).toBe('API Error')
    expect(component.isLoading()).toBe(false)
  })

  it('should not call service if form is invalid', async () => {
    ;(component as any).formSchema.update((s: any) => ({
      ...s,
      url: 'invalid-url',
    }))
    component.urlForm.url().markAsDirty()

    const event = new Event('submit')
    await component.onSubmit(event)

    expect(thumbnailServiceMock.generateImages).not.toHaveBeenCalled()
  })

  describe('downloadImage', () => {
    it('should trigger download', () => {
      const mockImage = {
        type: 'basic',
        filename: 'test.jpg',
        dataUrl: 'data:...',
      }
      const clickSpy = vi.fn()
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue({
          click: clickSpy,
          href: '',
          download: '',
        } as any)

      component.downloadImage(mockImage as any)

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
      createElementSpy.mockRestore()
    })
  })
})
