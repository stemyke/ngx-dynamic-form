import {FormInput, FormFieldSet} from "../public_api";
import {FormSelect} from "../dynamic-form/dynamic-form.decorators";
import {FormControlTester, IDynamicForm, IFormControl} from "../dynamic-form/dynamic-form.types";
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
        classes: "col-sm-6",
        readonly: {
            type: TestModel,
            func: TestModel.testField,
            params: ["select", "test1"]
        }
    })
    name: string = "Béla";

    @FormInput({
        fieldSet: "credentials",
        classes: "col-sm-6"
    })
    password: string = "Józsi";

    @FormInput({
        fieldSet: "test",
        classes: "col-sm-6",
        type: "mask",
        mask: ["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        unmask: value => value ? value.replace(/[(|)|_|\-| ]/gi, "") : ""
    })
    masked: string = "";

    @FormInput({
        fieldSet: "test",
        classes: "col-sm-6"
    })
    num: number = 0;

    @FormInput({
        fieldSet: "test",
        classes: "col-sm-12",
        type: "textarea",
        hidden: {
            type: TestModel,
            func: TestModel.testField,
            params: ["select", "test1"]
        }
    })
    textarea: string = "Józsi";

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-4",
        emptyOption: true,
        validator: (control: IFormControl, form: IDynamicForm) => {
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
        validator: (control: IFormControl, form: IDynamicForm) => {
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
        validator: (control: IFormControl, form: IDynamicForm) => {
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
        validator: (control: IFormControl, form: IDynamicForm) => {
            const value = form.data[control.id];
            return Promise.resolve(ObjectUtils.isArray(value) && value.indexOf("test2") >= 0 ? null : "should-select-test2-at-least")
        },
        options: () => Promise.resolve([
            {id: "test1", label: "label.test1"},
            {id: "test2", label: "label.test2"},
            {id: "test3", label: "label.test3"},
            {id: "test4", label: "label.test4"}
        ]),
        readonly: {
            type: TestModel,
            func: TestModel.testField,
            params: ["select", "test2"]
        }
    })
    select4: string[] = ["test1", "test2"];

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-6",
        type: "checkbox",
        multi: true,
        readonly: {
            type: TestModel,
            func: TestModel.testField,
            params: ["select", "test2"]
        },
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

    static testField(id: string, value: string): FormControlTester {
        return (control: IFormControl, form: IDynamicForm): Promise<boolean> => {
            return Promise.resolve(form.data[id] == value);
        }
    }
}
