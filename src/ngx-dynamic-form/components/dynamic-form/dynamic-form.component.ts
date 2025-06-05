import {Component, computed, inject, Injector, input, output, resource, ViewEncapsulation} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {FormlyFormOptions} from "@ngx-formly/core";
import {FormFieldConfig, IDynamicForm} from "../../common-types";
import {rxToSignal} from "../../utils/signals";
import {DynamicFormBuilderService} from "../../services/dynamic-form-builder.service";

@Component({
    standalone: false,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormComponent implements IDynamicForm {

    protected readonly builder = inject(DynamicFormBuilderService);

    readonly labelPrefix = input<string>("label");

    readonly model = input<any>({});

    readonly fields = input<FormFieldConfig[]>(null);

    protected readonly config$ = resource({
        request: () => ({
            fields: this.fields(),
            labelPrefix: this.labelPrefix()
        }),
        loader: async p => {
            const {fields, labelPrefix} = p.request;
            return fields || this.builder.resolveFormFields(this.model()?.constructor, null, {
                labelPrefix
            });
        }
    });

    readonly config = computed(() => this.config$.value());

    readonly group = computed(() => {
        this.config();
        return new FormGroup({});
    });

    protected readonly status$ = computed(() => this.group()?.statusChanges);

    readonly status = rxToSignal(this.status$, "PENDING");

    readonly onSubmit = output<IDynamicForm>();

    readonly options: FormlyFormOptions = {
        formState: {
            injector: inject(Injector)
        }
    };

    submit() {
        this.onSubmit.emit(this);
    }
}
