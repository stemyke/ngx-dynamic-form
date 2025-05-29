import {
    Component,
    computed,
    inject,
    Injector,
    input,
    output,
    signal,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {FormlyForm, FormlyFormOptions} from "@ngx-formly/core";
import {FormFieldConfig, IDynamicForm} from "../../common-types";
import {rxToSignal} from "../../utils/signals";

@Component({
    standalone: false,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormComponent implements IDynamicForm {

    readonly model = input<any>({});

    readonly fields = input<FormFieldConfig[]>([]);

    readonly group = computed(() => {
        this.fields();
        return new FormGroup({});
    });

    readonly status$ = computed(() => this.group()?.statusChanges);

    readonly status = rxToSignal(this.status$, "PENDING");

    readonly onSubmit = output<IDynamicForm>();

    readonly options: FormlyFormOptions = {
        formState: {
            injector: inject(Injector)
        }
    };

    readonly form = viewChild(FormlyForm);

    submit() {
        this.onSubmit.emit(this);
    }
}
