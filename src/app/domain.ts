import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const NOTIF = new InjectionToken<Observable<string>>('notifications');

export type BusinessObject = {
  key: string;
  content: string;
  loaded_at: Date;
};
