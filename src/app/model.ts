import {DatePipe} from "@angular/common";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    emailValidation,
    FormFieldSerializer,
    FormInput,
    FormSelect,
    FormSelectOption,
    FormSerializable,
    requiredValidation
} from "../public_api";

function getPreferredContacts(): Promise<FormSelectOption[]> {
    return new Promise<FormSelectOption[]>(resolve => {
        resolve([
            {id: "none", label: "prefereredContact.none"},
            {id: "phone", label: "prefereredContact.phone"},
            {id: "email", label: "prefereredContact.email"}
        ]);
    });
}

function serializeDate(format: string = "yyyy-MM-dd", defaultValue: string = ""): FormFieldSerializer {
    return (field, injector) => {
        const value: any = field.formControl.value;
        const date = injector.get(DatePipe);
        if (!ObjectUtils.isDate(value)) return Promise.resolve(value || defaultValue);
        return Promise.resolve(!format ? value : date.transform(value, format));
    };
}

export class OrderModel {

    @FormInput({
        label: "",
        fieldSet: "commission",
        validators: [requiredValidation()]
    })
    @FormSerializable()
    commission: string = "";

    @FormInput({
        label: "",
        fieldSet: "buyer",
        classes: "form-group-sm"
    })
    @FormSerializable()
    buyerFirstName: string = "";

    @FormInput({
        label: "",
        fieldSet: "buyer",
    })
    @FormSerializable()
    buyerLastName: string = "";

    @FormDate()
    @FormSerializable(serializeDate())
    buyerBirthday: Date = null;

    @FormInput({
        label: "",
        fieldSet: "address",
        placeholder: "label.buyerStreet"
    })
    @FormSerializable()
    buyerStreet: string = "";

    @FormInput({
        label: "",
        fieldSet: "address",
        classes: "form-group-sm",
        placeholder: "label.buyerZipCode"
    })
    @FormSerializable()
    buyerZipCode: string = "";

    @FormInput({
        label: "",
        fieldSet: "address",
        classes: "form-group-sm",
        placeholder: "label.buyerCity"
    })
    @FormSerializable()
    buyerCity: string = "";

    @FormInput({
        label: "",
        fieldSet: "contact-1",
        placeholder: "label.buyerEmail",
        validators: [emailValidation()]
    })
    @FormSerializable()
    buyerEmail: string = "";

    @FormInput({
        label: "",
        fieldSet: "contact-1",
        placeholder: "label.buyerPhone"
    })
    @FormSerializable()
    buyerPhone: string = "";

    @FormInput({
        label: "",
        fieldSet: "contact-2",
        placeholder: "label.buyerFax"
    })
    @FormSerializable()
    buyerFax: string = "";

    @FormInput({
        label: "",
        fieldSet: "contact-2",
        placeholder: "label.buyerMobile"
    })
    @FormSerializable()
    buyerMobile: string = "";

    @FormDate()
    @FormSerializable(serializeDate())
    desiredDeliveryDate: Date = null;

    @FormDate()
    @FormSerializable(serializeDate())
    weddingDate: Date = null;

    @FormSelect({
        options: FormOptions.getPreferredContacts
    })
    @FormSerializable()
    preferredContact: string = "";

    @FormSerializable()
    individualEngravingOptionLeft: string = "none";

    @FormSerializable()
    individualEngravingOptionRight: string = "none";

    @FormInput({
        fieldSet: "buyermessage",
        type: "textarea"
    })
    @FormSerializable()
    message: string = "";

    constructor(data?: any) {
        if (data) Object.assign(this, data);
    }
}
