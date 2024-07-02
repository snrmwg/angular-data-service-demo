import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from './data.service';
import { Subject, Subscription } from 'rxjs';
import { NOTIF } from './domain';
import { LoggerService } from './logger.service';
import { AsyncPipe } from '@angular/common';

const notifications$ = new Subject<string>();

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  providers: [
    LoggerService,
    DataService,
    {
      provide: NOTIF,
      useValue: notifications$,
    },
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  state: Record<string, boolean> = { k1: false, k2: false, k3: false };

  subs: Record<string, Subscription | null> = {
    k1: null,
    k2: null,
    k3: null,
  };

  constructor(private dataService: DataService, protected logger: LoggerService) {}

  isAktiv(key: string) {
    return !!this.state[key];
  }

  changed(key: string) {
    this.state[key] = !this.state[key];
    let aktiv = this.state[key];
    if (aktiv) {
      this.subs[key] = this.dataService
        .businessObject$(key)
        .subscribe((next) => {
          this.logger.log(`${key} business object -> ${JSON.stringify(next)}`);
        });
      this.logger.log(`App: ${key} subscribed`);
    } else {
      this.subs[key]!.unsubscribe();
      this.subs[key] = null;
      this.logger.log(`App: ${key} unsubscribed`);
    }
  }

  ngOnInit(): void {
    notifications$.subscribe((next) => this.logger.log(`notif ${next}`));
  }

  sendNotif(key: string) {
    notifications$.next(key);
  }
}
