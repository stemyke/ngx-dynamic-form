import {DatePipe} from "@angular/common";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    emailValidation,
    FormFieldSerializer,
    FormGroup,
    FormInput,
    FormSelect,
    FormSelectOption,
    FormSerializable,
    FormUpload,
    minValueValidation,
    requiredValidation
} from "../public_api";
import {FormArray} from "../ngx-dynamic-form/utils/decorators";

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

export class AddressModel {

    @FormInput({
        fieldSet: "fds",
        hidden: true,
        placeholder: "label.buyerStreet"
    })
    @FormSerializable()
    street: string = "";

    @FormInput({
        classes: "form-group-sm",
        placeholder: "label.buyerZipCode"
    })
    @FormSerializable()
    zip: string = "";

    @FormInput({
        classes: "form-group-sm",
        placeholder: "label.buyerCity"
    })
    @FormSerializable()
    city: string = "";
}
export class OrderModel {

    @FormInput({
        fieldSet: "commission",
        validators: [requiredValidation()]
    })
    @FormSerializable()
    commission: string = "";

    @FormInput({
        label: "buyerName",
        fieldSet: "buyer",
        classes: "form-group-sm"
    })
    @FormSerializable()
    buyerFirstName: string = "";

    @FormInput({
        fieldSet: "buyer",
    })
    @FormSerializable()
    buyerLastName: string = "";

    // @FormDate()
    @FormSerializable(serializeDate())
    buyerBirthday: Date = null;

    @FormGroup({label: ""})
    buyerAddress: AddressModel = new AddressModel();

    @FormArray(AddressModel, {useTabs: true, tabsLabel: "street"})
    addresses: AddressModel[] = [];

    @FormArray("text")
    lines: string[] = [];

    @FormArray({
        type: "number",
        step: 0.05,
        min: 3,
        validators: [minValueValidation(5)]
    })
    nums: number[] = [];

    @FormInput({
        fieldSet: "contact-1",
        placeholder: "label.buyerEmail",
        validators: [emailValidation()]
    })
    @FormSerializable()
    buyerEmail: string = "";

    @FormInput({
        fieldSet: "contact-1",
        placeholder: "label.buyerPhone"
    })
    @FormSerializable()
    buyerPhone: string = "";

    @FormInput({
        fieldSet: "contact-2",
        placeholder: "label.buyerFax"
    })
    @FormSerializable()
    buyerFax: string = "";

    @FormInput({
        fieldSet: "contact-2",
        placeholder: "label.buyerMobile"
    })
    @FormSerializable()
    buyerMobile: string = "";

    // @FormDate()
    @FormSerializable(serializeDate())
    desiredDeliveryDate: Date = null;

    // @FormDate()
    @FormSerializable(serializeDate())
    weddingDate: Date = null;

    @FormSelect({
        options: getPreferredContacts
    })
    @FormSerializable()
    preferredContact: string = "";

    @FormSelect({
        options: getPreferredContacts,
        type: "radio"
    })
    @FormSerializable()
    radioContact: string = "";

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

    @FormUpload()
    @FormSerializable()
    file: string = "";

    constructor(data?: any) {
        if (data) Object.assign(this, data);
    }
}
