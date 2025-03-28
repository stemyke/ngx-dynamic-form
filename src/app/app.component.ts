import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation} from "@angular/core";
import {OpenApiService} from "@stemy/ngx-utils";

@Component({
    standalone: false,
    selector: "app-root",
    templateUrl: "./app.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

    schemas: string[];
    schema: string;


    constructor(private openApi: OpenApiService) {

    }

    ngOnInit(): void {
        this.openApi.getSchemas().then(schemas => {
            this.schemas = Object.keys(schemas);
        });
    }
}
