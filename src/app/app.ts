import { Component } from '@angular/core';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { CursorFollowerComponent } from './shared/components/cursor-follower/cursor-follower.component';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { HeroComponent } from './features/hero/hero.component';
import { AboutComponent } from './features/about/about.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { ServicesComponent } from './features/services/services.component';
import { ContactComponent } from './features/contact/contact.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [
    NavbarComponent,
    CursorFollowerComponent,
    WelcomeComponent,
    HeroComponent,
    AboutComponent,
    ProjectsComponent,
    ServicesComponent,
    ContactComponent,
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
}
