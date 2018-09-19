import {FormInput, FormFieldSet} from "../public_api";
import {FormSelect} from "../dynamic-form/dynamic-form.decorators";

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
        options: () => Promise.resolve([
            {id: "test1", label: "label.test1"},
            {id: "test2", label: "label.test2"}
        ])
    })
    select: string = "test2";

    @FormInput({
        type: "date"
    })
    date: Date = new Date();

}
