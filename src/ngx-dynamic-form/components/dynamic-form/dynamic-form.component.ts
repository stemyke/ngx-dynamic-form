import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    Injector,
    input,
    output,
    ViewEncapsulation
} from "@angular/core";
import {rxResource, toSignal} from "@angular/core/rxjs-interop";
import {FormGroup} from "@angular/forms";
import {Subject} from "rxjs";
import {FormlyFormOptions} from "@ngx-formly/core";
import {EventsService, LANGUAGE_SERVICE, ObjectUtils} from "@stemy/ngx-utils";

import {
    FormBuilderOptions,
    FormFieldChangeEvent,
    FormFieldConfig,
    FormFieldLabelCustomizer,
    IDynamicForm
} from "../../common-types";
import {controlStatus} from "../../utils/misc";
import {DynamicFormBuilderService} from "../../services/dynamic-form-builder.service";

@Component({
    standalone: false,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html",
    styleUrls: ["./dynamic-form.component.scss"],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent implements IDynamicForm {

    protected readonly builder = inject(DynamicFormBuilderService);

    protected readonly events = inject(EventsService);

    protected readonly languages = inject(LANGUAGE_SERVICE);

    readonly labelPrefix = input("label");

    readonly labelCustomizer = input<FormFieldLabelCustomizer>(null);

    readonly testId = input("");

    readonly useTabs = input(false);

    readonly data = input<any>({});

    readonly fields = input<FormFieldConfig[]>(null);

    readonly fieldChanges = new Subject<FormFieldChangeEvent>();

    protected readonly language = toSignal(this.events.languageChanged, {
        initialValue: this.languages.currentLanguage
    });

    protected readonly enableTranslations = toSignal(this.events.translationsEnabled, {
        initialValue: this.languages.enableTranslations
    });

    readonly config = computed(() => {
        const options = {
            labelPrefix: this.labelPrefix(),
            labelCustomizer: this.labelCustomizer(),
            testId: this.testId(),
        } as FormBuilderOptions;
        const fields = this.fields() || this.builder.resolveFormFields(this.data()?.constructor, null, options);
        return [
            this.builder.createFormGroup(
                null, () => fields,
                {
                    label: "",
                    useTabs: this.useTabs(),
                    hidden: false,
                    className: "dynamic-form-root-group"
                },
                null, options
            )
        ];
    });

    readonly group = computed(() => {
        this.config();
        return new FormGroup({});
    });

    protected readonly status$ = rxResource({
        request: () => this.group(),
        loader: p => controlStatus(p.request),
        defaultValue: "PENDING"
    });

    readonly status = computed(() => this.status$.value());

    readonly onSubmit = output<IDynamicForm>();

    readonly options: FormlyFormOptions = {
        fieldChanges: this.fieldChanges,
        formState: {
            injector: inject(Injector)
        }
    };

    constructor() {
        effect(() => {
            this.language();
            this.enableTranslations();
            this.config().forEach(field => {
                if (!ObjectUtils.isFunction(field.options?.detectChanges)) return;
                field.options.detectChanges(field);
            });
        });
    }

    submit() {
        this.onSubmit.emit(this);
    }

    reset() {
        this.options?.resetModel?.();
    }
}
