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
import {IAsyncMessage, OpenApiService} from "@stemy/ngx-utils";
import {DynamicFormService, IDynamicForm} from "../public_api";

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
            return this.forms.getFormModelForSchema(p.request, {
                labelPrefix: "form"
            });
        }
    })

    group = new FormGroup({});

    constructor(private openApi: OpenApiService, private forms: DynamicFormService) {

    }

    ngOnInit(): void {
        this.openApi.getSchemas().then(s => this.schemas.set(Object.keys(s)));
    }

    submit = async (form: IDynamicForm): Promise<IAsyncMessage> =>  {
        this.forms.serializeForm(form).then(res => {
            console.log("res", res);
        });
        return null;
    }
}
