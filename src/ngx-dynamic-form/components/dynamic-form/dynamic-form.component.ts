import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    Injector,
    input,
    output,
    resource,
    ViewEncapsulation
} from "@angular/core";
import {rxResource} from "@angular/core/rxjs-interop";
import {FormGroup} from "@angular/forms";
import {FormlyFormOptions} from "@ngx-formly/core";
import {FormFieldConfig, IDynamicForm} from "../../common-types";
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

    readonly labelPrefix = input<string>("label");

    readonly data = input<any>({});

    readonly fields = input<FormFieldConfig[]>(null);

    protected readonly config$ = resource({
        request: () => ({
            fields: this.fields(),
            labelPrefix: this.labelPrefix()
        }),
        loader: async p => {
            const {fields, labelPrefix} = p.request;
            return fields || this.builder.resolveFormFields(this.data()?.constructor, null, {
                labelPrefix
            });
        }
    });

    readonly config = computed(() => this.config$.value());

    readonly group = computed(() => {
        this.config();
        return new FormGroup({});
    });

    protected readonly status$ = rxResource({
        request: () => this.group(),
        loader: p => p.request.statusChanges
    });

    readonly status = computed(() => this.status$.value());

    readonly onSubmit = output<IDynamicForm>();

    readonly options: FormlyFormOptions = {
        formState: {
            injector: inject(Injector)
        }
    };

    submit() {
        this.onSubmit.emit(this);
    }

    reset() {
        this.options?.resetModel?.();
    }
}
