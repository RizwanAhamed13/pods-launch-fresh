import { afterNextRender, Component, signal } from '@angular/core';
@Component({selector:'app-root',templateUrl:'./app.html'})
export class App {
  readonly count=signal(0);
  constructor(){afterNextRender(()=>{this.load();});}
  async load(){this.count.set((await fetch('/api/count').then(r=>r.json())).count);}
  async add(){this.count.set((await fetch('/api/count',{method:'POST'}).then(r=>r.json())).count);}
}
