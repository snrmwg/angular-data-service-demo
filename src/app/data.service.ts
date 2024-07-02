import { Inject, Injectable } from '@angular/core';
import {
  Observable,
  Subscriber,
  Subscription,
  auditTime,
  finalize,
  groupBy,
  mergeMap,
  throttleTime,
} from 'rxjs';

import { BusinessObject, NOTIF } from './domain';
import { LoggerService } from './logger.service';
import { DATA_API_TOKEN, DataApi } from './data-api';

@Injectable()
export class DataService {
  private businessSubscribers = new Map<string, Set<Subscriber<BusinessObject>>>();
  private subscriptions = new Map<string, Subscription>();

  constructor(
    @Inject(DATA_API_TOKEN) dataApi: DataApi,
    @Inject(NOTIF) notifications$: Observable<string>,
    private logger: LoggerService
  ) {
    notifications$.pipe(
      groupBy((key) => key),
      mergeMap(group => group.pipe(
        // throttleTime(5_000)
        auditTime(5_000)
      ))
    ).subscribe((key) => {
      const sub = this.businessSubscribers.has(key);
      const isFetching = this.subscriptions.has(key);
      logger.log(`data-service received notif ${key} subscribers? ${sub} isFetching? ${isFetching}`);
      if (sub) {
        if (isFetching) {
          // um laufendes Laden abzubrechen:
          // this.subscriptions.get(key)!.unsubscribe();

          // oder einfach diese Notification ignorieren und zu Ende laden lassen
          return;
        }

        const newSub = dataApi.fetchBusinessObject$(key)
          .pipe(
            finalize(() => this.subscriptions.delete(key))
          )
          .subscribe(bo => this.notifySubscribers(key, bo));
        this.subscriptions.set(key, newSub);
      }
      // TODO else unknownBusinessKeys$.next(key);
      //   kann von UI genutzt werden, um neue Compontent fuer jeweiligen Key zu erstellen
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
}
