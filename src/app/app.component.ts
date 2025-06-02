import {
    ChangeDetectionStrategy,
    Component, computed,
    linkedSignal,
    OnInit,
    resource,
    signal,
    ViewEncapsulation
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {IAsyncMessage, OpenApiService} from "@stemy/ngx-utils";
import {DynamicFormService, IDynamicForm} from "../public_api";
import {firstValueFrom} from "rxjs";
import {OrderModel} from "./model";

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
            const value = prev?.value || localStorage.getItem("selectedSchema");
            return !schemas.length || schemas.includes(value) ? value : schemas[0] ?? "-";
        }
    });

    fields = resource({
        request: () => this.schema(),
        loader: async p => {
            localStorage.setItem("selectedSchema", p.request);
            return this.forms.getFormFieldsForSchema(p.request, {
                labelPrefix: "form"
            });
        }
    });

    model = signal<any>({
        externalId: "X",
        attachments: [],
        openingHours: [
            {lang: "hu", translation: "Hétfő"},
            {lang: "en", translation: "Monday"},
        ]
    });

    decoratorModel = signal<any>(new OrderModel());

    constructor(private openApi: OpenApiService, private forms: DynamicFormService) {
        setTimeout(() => {
            this.model.update(value => {
                return {
                    ...value,
                    email: "test@mail.com"
                };
            });
        }, 1000);
    }

    ngOnInit(): void {
        this.openApi.getSchemas().then(s => this.schemas.set(Object.keys(s).sort()));
    }

    submit = async (form: IDynamicForm): Promise<IAsyncMessage> =>  {
        this.forms.serializeForm(form).then(res => {
            console.log("res", res);
        });
        return null;
    }
}
