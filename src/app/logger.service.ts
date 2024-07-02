import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoggerService {
  readonly log$: BehaviorSubject<string> = new BehaviorSubject<string>('ready...');

  clear = () => this.log$.next('ready...');

  log(s: string) {
    this.log$.next(`${new Date().getTime()}: ${s}\n${this.log$.value}`);
  }
}
