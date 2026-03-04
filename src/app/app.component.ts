import {
    ChangeDetectionStrategy,
    Component, Inject,
    linkedSignal,
    OnInit,
    resource,
    signal,
    ViewEncapsulation
} from "@angular/core";
import {IAsyncMessage, ILanguageService, LANGUAGE_SERVICE, OpenApiService} from "@stemy/ngx-utils";
import {
    addFieldValidators,
    DynamicFormBuilderService,
    DynamicFormSchemaService,
    DynamicFormService,
    IDynamicForm,
    requiredValidation,
    setFieldDisabled,
    setFieldHidden,
    setFieldHooks
} from "../public_api";
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
                labelPrefix: "form",
                fieldCustomizer: async (field, options) => {
                    if (field.key === "premium") {
                        setFieldHidden(field);
                    }
                    if (field.key === "name") {
                        addFieldValidators(field, [requiredValidation()]);
                    }
                    if (field.key === "externalId") {
                        setFieldDisabled(field);
                    }
                    if (field.key === "integrationOptions") {
                        setFieldHooks(field, {
                            onInit: target => {
                                const premium = target.formControl.root.get("premium");
                                setFieldHidden(target, !premium.value);
                                premium.valueChanges.subscribe(value => {
                                    setFieldHidden(target, !value);
                                });
                            }
                        });
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
        premium: true,
        openingHours: [
            {lang: "hu", translation: "Hétfő"},
            {lang: "en", translation: "Monday"},
        ]
    });

    decoratorData = signal<any>(new OrderModel());

    constructor(readonly openApi: OpenApiService,
                readonly fb: DynamicFormBuilderService,
                readonly fs: DynamicFormSchemaService,
                readonly forms: DynamicFormService,
                @Inject(LANGUAGE_SERVICE) readonly language: ILanguageService) {
        setTimeout(() => {
            this.plainData.update(value => {
                return {
                    ...value,
                    email: "test@mail.com"
                };
            });
        }, 1000);
        this.language.addLanguages(["en", "de", "hu"]);
    }

    ngOnInit(): void {
        this.openApi.getSchemas().then(s => this.schemas.set(Object.keys(s).sort()));
    }

    submit = async (form: IDynamicForm): Promise<IAsyncMessage> => {
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
