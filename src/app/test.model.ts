import {FactoryDependencies, ObjectUtils} from "@stemy/ngx-utils";
import {
    FormControlTester, FormFieldSet, FormInput, FormModel, FormSelect, FormSerializable, FormStatic, IDynamicForm,
    IFormControl, IFormControlSerializer, IFormInputData
} from "../public_api";
import {DatePipe} from "@angular/common";
import {SubModel} from "./sub.model";
import {createFormInput} from "../ngx-dynamic-form/common-types";

const test: IFormInputData = {
    type: "textarea"
};

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
        classes: "col-sm-4",
        max: 10,
        readonly: {
            type: TestModel,
            func: TestModel.testField,
            params: ["select", "test1"]
        }
    })
    @FormSerializable()
    name: string = "Béla";

    @FormInput({
        fieldSet: "credentials",
        classes: "col-sm-4"
    })
    @FormSerializable()
    password: string = "Józsi";

    @FormInput({
        fieldSet: "credentials",
        classes: "col-sm-4"
    })
    @FormSerializable()
    rememberMe: boolean = false;

    @FormInput({
        fieldSet: "test",
        classes: "col-sm-6",
        type: "mask",
        mask: ["(", /[1-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/],
        unmask: value => value ? value.replace(/[(|)|_|\-| ]/gi, "") : ""
    })
    @FormSerializable()
    masked: string = "";

    @FormInput({
        fieldSet: "test",
        classes: "col-sm-6",
        max: 100
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
        reload: "date",
        options: () => Promise.resolve([
            {id: "test5", label: "label.test5"},
            {id: "test3", label: "label.test3"}
        ])
    })
    select6: string = null;

    @FormInput({
        type: "date",
        reload: "select6"
    })
    @FormSerializable()
    date: Date = new Date();

    @FormSerializable()
    veryTest: string = "blabla";

    @FormStatic({
        properties: ["test1", "num", "date"]
    })
    staticData: any = {
        test2: "blah",
        test1: "glfdkgfd",
        num: 1010,
        date: new Date()
    };

    @FormStatic()
    staticData2: any = new Date();

    @FormModel({
        name: "address"
    })
    @FormSerializable()
    address: SubModel = new SubModel();

    static testField(id: string, value: string): FormControlTester {
        return (control: IFormControl, form: IDynamicForm): Promise<boolean> => {
            return Promise.resolve(form.data[id] == value);
        }
    }

    @FactoryDependencies(DatePipe)
    static serializeDate(date: DatePipe): IFormControlSerializer {
        return (id: string, form: IDynamicForm): Promise<any> => {
            const value: any = form.data[id];
            return Promise.resolve(ObjectUtils.isDate(value) ? date.transform(value, "yyyy-MM-dd") : value || "");
        }
    }
}
