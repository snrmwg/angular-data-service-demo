import { Observable } from "rxjs";
import { BusinessObject } from "./domain";
import { Injectable, InjectionToken } from "@angular/core";
import { LoggerService } from "./logger.service";

export interface DataApi {
  fetchBusinessObject$(key: string): Observable<BusinessObject>;
}

export const DATA_API_TOKEN = new InjectionToken<DataApi>('data-api');

@Injectable()
export class StubDataApi implements DataApi {
  constructor(private logger: LoggerService) { }

  public fetchBusinessObject$(key: string): Observable<BusinessObject> {
    // 3-8s Ladezeit simulieren
    const randomDelay = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;

    return new Observable<BusinessObject>((observer) => {
      this.logger.log(`data-api: Lade key ${key} Start (${randomDelay}ms Delay)`);

      let completed = false;
      const timeout = setTimeout(() => {
        observer.next({
          key,
          content: `schalala fuer key: ${key}`,
          loaded_at: new Date(),
        });
        completed = true;
        observer.complete();
      }, randomDelay);

      return () => {
        clearTimeout(timeout);
        if (completed) {
          this.logger.log(`data-api: Laden key ${key} completed`);
        } else {
          this.logger.log(`data-api: Laden key ${key} ABGEBROCHEN`);
        }
      };
    });
  }
}


// RestDataApi
// return this.http.get<BusinessObject>(`/api/business-objects/${key}`)
//   .pipe(
//     catchError(() => ...)
//   );
