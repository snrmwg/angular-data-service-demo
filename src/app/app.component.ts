import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { BusinessItemComponent } from './business-item.component';
import { DATA_API_TOKEN, StubDataApi } from './data-api';
import { DataService } from './data.service';
import { NOTIF } from './domain';
import { LoggerService } from './logger.service';

const notifications$ = new Subject<string>();

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, AsyncPipe, BusinessItemComponent],
  providers: [
    LoggerService,
    {
      provide: DATA_API_TOKEN,
      useClass: StubDataApi
    },
    DataService,
    {
      provide: NOTIF,
      useValue: notifications$,
    },
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  
  constructor(protected logger: LoggerService) {}

  ngOnInit(): void {
    notifications$.subscribe((next) => this.logger.log(`App: notif ${next}`));
  }

  sendNotif(key: string) {
    notifications$.next(key);
  }
}
