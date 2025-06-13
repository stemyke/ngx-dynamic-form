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
import {EventsService, LANGUAGE_SERVICE} from "@stemy/ngx-utils";

import {FormFieldChangeEvent, FormFieldConfig, IDynamicForm} from "../../common-types";
import {DynamicFormBuilderService} from "../../services/dynamic-form-builder.service";

@Component({
    standalone: false,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent implements IDynamicForm {

    protected readonly builder = inject(DynamicFormBuilderService);

    protected readonly events = inject(EventsService);

    protected readonly languages = inject(LANGUAGE_SERVICE);

    readonly labelPrefix = input<string>("label");

    readonly testId = input<string>("");

    readonly data = input<any>({});

    readonly fields = input<FormFieldConfig[]>(null);

    readonly fieldChanges = new Subject<FormFieldChangeEvent>();

    protected readonly language = toSignal(this.events.languageChanged, {
        initialValue: this.languages.currentLanguage
    });

    readonly config = computed(() => {
        return this.fields() || this.builder.resolveFormFields(this.data()?.constructor, null, {
            labelPrefix: this.labelPrefix(),
            testId: this.testId(),
        });
    });

    readonly group = computed(() => {
        this.config();
        return new FormGroup({});
    });

    protected readonly status$ = rxResource({
        request: () => this.group(),
        loader: p => p.request.statusChanges,
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
            this.config().forEach(field => {
                if (!field.options) return;
                this.options.detectChanges(field);
            });
        });
    }

    submit() {
        // TODO: Templ disable submit
        // this.onSubmit.emit(this);
    }

    reset() {
        this.options?.resetModel?.();
    }
}
