import {FormInput, FormFieldSet} from "../public_api";
import {FormSelect} from "../dynamic-form/dynamic-form.decorators";
import {IDynamicForm, IFormControl} from "../dynamic-form/dynamic-form.types";

@FormFieldSet({
    id: "credentials",
    classes: "form-row"
})
@FormFieldSet({
    id: "numbers",
    classes: "form-row"
})
export class TestModel {

    @FormInput({
        fieldSet: "credentials",
        classes: "col-sm-6"
    })
    name: string = "Béla";

    @FormInput({
        fieldSet: "credentials",
        classes: "col-sm-6"
    })
    password: string = "Józsi";

    @FormInput({
        fieldSet: "numbers",
        classes: "col-sm-6"
    })
    num: number = 0;

    @FormSelect({
        fieldSet: "numbers",
        classes: "col-sm-6",
        emptyOption: true,
        validator: (form: IDynamicForm, control: IFormControl) => {
            return Promise.resolve(form.data[control.id] == "test2" ? null : "should-select-test2")
        },
        options: () => Promise.resolve([
            {id: "test1", label: "label.test1"},
            {id: "test2", label: "label.test2"}
        ])
    })
    select: string = null;

    @FormInput({
        type: "date"
    })
    date: Date = new Date();

}
