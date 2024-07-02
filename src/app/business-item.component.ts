import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { DataService } from "./data.service";
import { LoggerService } from "./logger.service";

@Component({
  selector: 'app-business-item',
  standalone: true,
  templateUrl: './business-item.component.html',
  imports: [FormsModule]
})
export class BusinessItemComponent {
  @Input('business-key') key!: string;

  aktiv = false
  sub?: Subscription;
  data?: string;

  constructor(private dataService: DataService, private logger: LoggerService) {}

  changed() {
    this.aktiv = !this.aktiv;
    if (this.aktiv) {
      this.sub = this.dataService
        .businessObject$(this.key)
        .subscribe((next) => {
          this.logger.log(`${this.key}: business object -> ${JSON.stringify(next)}`);
          this.data = JSON.stringify(next);
        });
      this.logger.log(`${this.key}: subscribed`);
    } else {
      this.sub!.unsubscribe();
      this.sub = undefined;
      this.logger.log(`${this.key}: unsubscribed`);
    }
  }
}
