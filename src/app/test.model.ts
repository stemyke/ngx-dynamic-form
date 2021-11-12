import {FactoryDependencies, ObjectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl,
    FormControlTester,
    FormFieldSet,
    FormInput,
    FormModel,
    FormSelect,
    FormSerializable,
    FormStatic,
    IDynamicForm,
    IFormControlSerializer
} from "../public_api";
import {DatePipe} from "@angular/common";
import {SubModel} from "./sub.model";
import {IDynamicFormControl} from "../ngx-dynamic-form/common-types";

@FormFieldSet({
    id: "credentials",
    classes: "form-row"
})
@FormFieldSet({
    id: "test",
    title: "Form row title!!!",
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
        validator: (control: IDynamicFormControl) => {
            return Promise.resolve(control.value == "test1" ? null : "should-select-test1")
        },
        options: () => Promise.resolve([
            {id: "test1", label: "label.test1"},
            {id: "test2", label: "label.test2"}
        ])
    })
    select: string = "test1";

    @FormSelect({
        fieldSet: "selects",
        classes: "col-sm-4",
        type: "radio",
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
        validator: (control: IDynamicFormControl) => {
            return Promise.resolve(ObjectUtils.isArray(control.value) && control.value.indexOf("test2") >= 0 ? null : "should-select-test2-at-least")
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
        return (control: IDynamicFormControl): Promise<boolean> => {
            return Promise.resolve(control.model[id] == value);
        }
    }

    @FactoryDependencies(DatePipe)
    static serializeDate(date: DatePipe): IFormControlSerializer {
        return (id: string, parent: IDynamicFormControl): Promise<any> => {
            const value: any = parent.model[id];
            return Promise.resolve(ObjectUtils.isDate(value) ? date.transform(value, "yyyy-MM-dd") : value || "");
        }
    }
}
