import {FormInput, FormFieldSet} from "../public_api";
import {FormSelect} from "../dynamic-form/dynamic-form.decorators";
import {IDynamicForm, IFormControl} from "../dynamic-form/dynamic-form.types";
import {ObjectUtils} from "@stemy/ngx-utils";

@FormFieldSet({
    id: "credentials",
    classes: "form-row"
})
@FormFieldSet({
    id: "test",
    classes: "form-row"
})
@FormFieldSet({
    id: "selects",
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
        fieldSet: "test",
        classes: "col-sm-6"
    })
    num: number = 0;

    @FormInput({
        fieldSet: "test",
        classes: "col-sm-6",
        type: "textarea"
    })
    textarea: string = "Józsi";

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-4",
        emptyOption: true,
        validator: (form: IDynamicForm, control: IFormControl) => {
            return Promise.resolve(form.data[control.id] == "test2" ? null : "should-select-test2")
        },
        options: () => Promise.resolve([
            {id: "test1", label: "label.test1"},
            {id: "test2", label: "label.test2"}
        ])
    })
    select: string = "test2";

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-4",
        type: "radio",
        validator: (form: IDynamicForm, control: IFormControl) => {
            return Promise.resolve(form.data[control.id] == "test5" ? null : "should-select-test5")
        },
        options: () => Promise.resolve([
            {id: "test5", label: "label.test5"},
            {id: "test3", label: "label.test3"}
        ])
    })
    select2: string = null;

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-4",
        type: "checkbox",
        validator: (form: IDynamicForm, control: IFormControl) => {
            return Promise.resolve(form.data[control.id] == "test5" ? null : "should-select-test5")
        },
        options: () => Promise.resolve([
            {id: "test5", label: "label.test5"},
            {id: "test3", label: "label.test3"}
        ])
    })
    select3: string = null;

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-6",
        emptyOption: true,
        multi: true,
        validator: (form: IDynamicForm, control: IFormControl) => {
            const value = form.data[control.id];
            return Promise.resolve(ObjectUtils.isArray(value) && value.indexOf("test2") >= 0 ? null : "should-select-test2-at-least")
        },
        options: () => Promise.resolve([
            {id: "test1", label: "label.test1"},
            {id: "test2", label: "label.test2"},
            {id: "test3", label: "label.test3"},
            {id: "test4", label: "label.test4"}
        ])
    })
    select4: string[] = ["test1", "test2"];

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-6",
        type: "checkbox",
        multi: true,
        options: () => Promise.resolve([
            {id: "test5", label: "label.test5"},
            {id: "test3", label: "label.test3"}
        ])
    })
    select6: string = null;

    @FormInput({
        type: "date"
    })
    date: Date = new Date();

}
