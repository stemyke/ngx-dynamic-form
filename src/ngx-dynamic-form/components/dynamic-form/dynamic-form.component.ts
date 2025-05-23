import {Component, computed, input, output, viewChild, ViewEncapsulation} from "@angular/core";
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

    fields = input<FormFieldConfig[]>();
    group = input<FormGroup>();
    data = input<any>({});
    form = viewChild(FormlyForm);

    options: FormlyFormOptions = {};

    readonly status$ = computed(() => this.group()?.statusChanges);

    readonly status = rxToSignal(this.status$, "PENDING");

    onSubmit = output<IDynamicForm>();

    submit() {
        this.onSubmit.emit(this);
    }
}
