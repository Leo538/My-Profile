import { Component, inject } from '@angular/core';
import { profileData } from '../../../core/data/profile.data';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-black text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p class="text-sm opacity-80">
              © {{ currentYear }} {{ profileData.name }}. {{ t.footer.rights }}
            </p>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  private translationService = inject(TranslationService);
  profileData = profileData;
  currentYear = new Date().getFullYear();
  
  get t() {
    return this.translationService.t;
  }
}
