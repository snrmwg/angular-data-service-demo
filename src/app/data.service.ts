import { Inject, Injectable } from '@angular/core';
import {
  Observable,
  Subscriber,
  Subscription,
} from 'rxjs';

import { BusinessObject, NOTIF } from './domain';
import { LoggerService } from './logger.service';

@Injectable()
export class DataService {
  private businessSubscribers = new Map<string, Set<Subscriber<BusinessObject>>>();

  private subscriptions = new Map<string, Subscription>();

  constructor(
    // private http: HttpClient,
    @Inject(NOTIF) notifications$: Observable<string>,
    private logger: LoggerService
  ) {
    notifications$.subscribe((key) => {
      const sub = this.businessSubscribers.has(key);
      logger.log(`DataService received notif ${key} ${sub}`);
      if (sub) {
        if (this.subscriptions.has(key)) {
          this.subscriptions.get(key)!.unsubscribe();
        }

        const newSub = this.fetchBusinessObject(key).subscribe(bo => this.notifySubscribers(key, bo));
        this.subscriptions.set(key, newSub);
      }
    });
  }

  businessObject$(key: string): Observable<BusinessObject> {
    return new Observable<BusinessObject>((subscriber) => {
      this.subscribe(key, subscriber);

      return () => {
        this.unsubscribe(key, subscriber);
      };
    });
  }

  private subscribe(key: string, subscriber: Subscriber<BusinessObject>) {
    let subscribers = this.businessSubscribers.get(key);
    if (!subscribers) {
      subscribers = new Set<Subscriber<BusinessObject>>();
      this.businessSubscribers.set(key, subscribers);
    }
    subscribers.add(subscriber);
  }

  private unsubscribe(key: string, subscriber: Subscriber<BusinessObject>) {
    const subscribers = this.businessSubscribers.get(key);
    if (subscribers) {
      const unsubscribed = subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        this.businessSubscribers.delete(key);

        if (this.subscriptions.has(key)) {
          this.logger.log('data-service: last unsubscribe, unsubscribing from business object fetch')
          this.subscriptions.get(key)!.unsubscribe();
          this.subscriptions.delete(key);
        }
      }
      if (unsubscribed) {
        this.logger.log(`data-service: unsubscribed from business object ${key}`);
      }
    }
  }

  private notifySubscribers(key: string, businessObject: BusinessObject) {
    const subscribers = this.businessSubscribers.get(key);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        subscriber.next(businessObject);
      });
    }
  }

  private fetchBusinessObject(key: string): Observable<BusinessObject> {
    // return this.http.get<BusinessObject>(`/api/business-objects/${key}`)
    //   .pipe(
    //     catchError(() => of(null)) // Handle errors gracefully (optional)
    //   );

    return new Observable<BusinessObject>((observer) => {
      // 3-8s Ladezeit simulieren
      const randomDelay = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
      this.logger.log(`Lade key ${key} Start (${randomDelay}ms Delay)`);

      let completed = false;
      const timeout = setTimeout(() => {
        observer.next({
          key,
          content: `schalala fuer key: ${key}`,
        });
        completed = true;
        observer.complete();
      }, randomDelay);

      return () => {
        clearTimeout(timeout);
        if (completed) {
          this.logger.log(`Laden key ${key} completed`);
        } else {
          this.logger.log(`Laden key ${key} ABGEBROCHEN`);
        }
      };
    });
  }
}
