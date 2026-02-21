import { Component } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'
import { LayoutImports } from '@/shared/components/layout'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LayoutImports, RouterLink],
  templateUrl: './app.html',
})
export class App {
  readonly currentYear = new Date().getFullYear()
}
