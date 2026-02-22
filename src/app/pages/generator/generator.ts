import { Component, computed, inject, signal } from '@angular/core'
import { ZardCardComponent } from '@/shared/components/card'
import {
  form,
  FormField,
  submit,
  validateStandardSchema,
} from '@angular/forms/signals'
import { ZardFormImports } from '@/shared/components/form'
import { ZardInputDirective } from '@/shared/components/input'
import { ZardButtonComponent } from '@/shared/components/button'
import { ThumbnailGeneratorService } from '@/services/thumbnail-generator.service'
import { catchError, finalize, of, tap } from 'rxjs'
import { GeneratedImage, UrlFormSchema } from '@/models'
import { ZardLoaderComponent } from '@/shared/components/loader'
import { ZardAlertComponent } from '@/shared/components/alert'

@Component({
  selector: 'app-generator',
  imports: [
    ZardCardComponent,
    ZardFormImports,
    FormField,
    ZardInputDirective,
    ZardButtonComponent,
    ZardLoaderComponent,
    ZardAlertComponent,
  ],
  templateUrl: './generator.html',
})
export class Generator {
  readonly errorMessage = signal<string>('')
  readonly generatedImages = signal<GeneratedImage[]>([])
  readonly isLoading = signal(false)
  private readonly thumbnailGeneratorService = inject(ThumbnailGeneratorService)
  private readonly formSchema = signal({
    url: '',
  })
  readonly urlForm = form(this.formSchema, schema => {
    return validateStandardSchema(schema, UrlFormSchema)
  })
  private readonly isSubmitting = signal(false)
  readonly isInvalidForm = computed(
    () =>
      this.urlForm().invalid() && this.urlForm().dirty() && this.isSubmitting()
  )

  async onSubmit(event: Event) {
    event.preventDefault()
    this.isSubmitting.set(true)

    await submit(this.urlForm, async () => {
      if (this.urlForm().valid()) {
        this.isLoading.set(true)
      }
      this.thumbnailGeneratorService
        .generateImages(this.formSchema().url)
        .pipe(
          tap(data => {
            this.generatedImages.set(data)
          }),
          catchError(error => {
            console.error('Thumbnail generation error:', error)
            this.errorMessage.set(`${error.message}`)
            return of(null)
          }),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe()
    })
  }

  downloadImage(image: GeneratedImage) {
    const link = document.createElement('a')
    link.href = image.dataUrl
    link.download = image.filename
    link.click()
  }

  downloadAll() {
    this.generatedImages().forEach((img, index) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = img.dataUrl
        a.download = img.filename
        a.click()
      }, index * 150)
    })
  }
}
