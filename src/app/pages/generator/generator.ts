import { Component, computed, signal } from '@angular/core'
import { ZardCardComponent } from '@/shared/components/card'
import { form, FormField, validateStandardSchema, submit } from '@angular/forms/signals'
import { UrlFormSchema } from '@/models/form.model'
import { ZardFormImports } from '@/shared/components/form'
import { ZardInputDirective } from '@/shared/components/input'
import { ZardButtonComponent } from '@/shared/components/button'

@Component({
  selector: 'app-generator',
  imports: [
    ZardCardComponent,
    ZardFormImports,
    FormField,
    ZardInputDirective,
    ZardButtonComponent
  ],
  templateUrl: './generator.html',
})
export class Generator {
  private readonly formSchema = signal({
    url: ''
  })

  readonly urlForm = form(this.formSchema, schema => {
    return validateStandardSchema(schema, UrlFormSchema)
  })

  readonly isInvalidForm = computed(() => this.urlForm().invalid() && this.urlForm().dirty() && this.isSubmitting())
  private readonly isSubmitting = signal(false)

  async onSubmit(event: Event) {
    event.preventDefault()
    this.isSubmitting.set(true)
    await submit(this.urlForm,  async () => {
      console.log(this.formSchema().url)
    });
  }
}
