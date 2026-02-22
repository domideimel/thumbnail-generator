import { computed, Directive, inject, Injectable, input } from '@angular/core'

@Injectable({ providedIn: 'root' })
class ZardIdInternalService {
  private counter = 0

  generate (prefix: string) {
    return `${prefix}-${++this.counter}`
  }
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[zardId]',
  exportAs: 'zardId',
})
export class ZardIdDirective {
  readonly zardId = input('ssr')
  private idService = inject(ZardIdInternalService)
  readonly id = computed(() => this.idService.generate(this.zardId()))
}
