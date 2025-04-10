import {
    ChangeDetectionStrategy,
    Component,
    linkedSignal,
    OnInit,
    resource,
    signal,
    ViewEncapsulation
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {OpenApiService} from "@stemy/ngx-utils";
import {FormlyFieldConfig, FormlyFormOptions} from "@ngx-formly/core";
import {FormlyService} from "../ngx-dynamic-form/services/formly.service";

@Component({
    standalone: false,
    selector: "app-root",
    templateUrl: "./app.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

    schemas = signal([] as string[]);
    schema = linkedSignal<string[], string>({
        source: () => this.schemas(),
        computation: (schemas, prev) => {
            const value = prev?.value || "AddJewelerDto";
            return !schemas.length || schemas.includes(value) ? value : schemas[0] ?? "-";
        }
    });
    fields = resource({
        request: () => this.schema(),
        loader: async p => {
            return this.formly.getFormModelForSchema(p.request, {
                labelPrefix: "form"
            });
        }
    })

    form = new FormGroup({});
    model: any = {};
    options: FormlyFormOptions = {
        formState: {
            awesomeIsForced: false,
        },
    };

    constructor(private openApi: OpenApiService, private formly: FormlyService) {

    }

    ngOnInit(): void {
        this.openApi.getSchemas().then(s => this.schemas.set(Object.keys(s)));
    }

    submit() {
        if (this.form.valid) {
            alert(JSON.stringify(this.model));
        }
    }
}
