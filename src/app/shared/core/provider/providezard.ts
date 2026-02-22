import { type EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core'
import { EVENT_MANAGER_PLUGINS } from '@angular/platform-browser'

import { ZardDebounceEventManagerPlugin } from '@/shared/core'
import { ZardEventManagerPlugin } from '@/shared/core'
import { ZardDarkMode } from '@/shared/services'

export function provideZard (): EnvironmentProviders {
  const eventManagerPlugins = [
    {
      provide: EVENT_MANAGER_PLUGINS,
      useClass: ZardEventManagerPlugin,
      multi: true,
    },
    {
      provide: EVENT_MANAGER_PLUGINS,
      useClass: ZardDebounceEventManagerPlugin,
      multi: true,
    },
  ]

  return makeEnvironmentProviders([provideAppInitializer(() => inject(ZardDarkMode).init()), ...eventManagerPlugins])
}
