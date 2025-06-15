import {
    ChangeDetectionStrategy,
    Component,
    linkedSignal,
    OnInit,
    resource,
    signal,
    ViewEncapsulation
} from "@angular/core";
import {IAsyncMessage, OpenApiService} from "@stemy/ngx-utils";
import {
    DynamicFormBuilderService,
    DynamicFormSchemaService,
    DynamicFormService,
    FORM_ROOT_KEY,
    IDynamicForm
} from "../public_api";
import {AddressModel, OrderModel} from "./model";

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
                labelPrefix: "form",
                fieldCustomizer: async (field, options) => {
                    if (field.key === FORM_ROOT_KEY) {
                        // const test = await this.forms.getFormFieldGroupForSchema("JewelerPriceContext");
                        field.fieldGroup.unshift(this.fb.resolveFormGroup("address", AddressModel, {}, field, options));
                        return field;
                    }
                    return field;
                }
            });
        }
    });

    plainData = signal<any>({
        externalId: "X",
        attachments: [],
        openingHours: [
            {lang: "hu", translation: "Hétfő"},
            {lang: "en", translation: "Monday"},
        ]
    });

    decoratorData = signal<any>(new OrderModel());

    constructor(private openApi: OpenApiService,
                private fb: DynamicFormBuilderService,
                private fs: DynamicFormSchemaService,
                private forms: DynamicFormService) {
        setTimeout(() => {
            this.plainData.update(value => {
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
        let data: any = null;
        try {
            data = await this.forms.serializeForm(form);
        } catch (e) {
            console.warn("validation errors", e);
            return null;
        }
        console.log("results", data);
        return null;
    }
}
