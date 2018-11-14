import {DynamicFormControl, FormFieldSet, FormInput, FormSerializable} from "../public_api";

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
export class SubModel {

    @FormInput({
        classes: "col-sm-6",
        max: 10
    })
    @FormSerializable()
    city: string = "";

    @FormInput({
        classes: "col-sm-6",
        max: 15,
        validator: (control: DynamicFormControl) => {
            return Promise.resolve(control.value == "Zöldfa utca" ? null : "Zöldfa utca legyen")
        }
    })
    @FormSerializable()
    street: string = "Zöldfa utca";
}
