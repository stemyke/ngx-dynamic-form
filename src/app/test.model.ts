import {FormInput, FormFieldSet} from "../public_api";

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

    @FormInput({
        fieldSet: "numbers",
        classes: "col-sm-6",
        step: 0.1
    })
    num2: number = 10;

    @FormInput({
        type: "date"
    })
    date: Date = new Date();

}
