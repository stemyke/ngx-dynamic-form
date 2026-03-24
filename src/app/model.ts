import {DatePipe} from "@angular/common";
import {ITranslation, ObjectUtils} from "@stemy/ngx-utils";
import {
    arrayLengthValidation,
    emailValidation,
    FormFieldSerializer,
    FormGroup,
    FormInput,
    FormSelect,
    FormSelectOption,
    FormSerializable, FormStatic,
    FormUpload,
    minValueValidation,
    requiredValidation, RichTranslationModel, TranslationModel
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
        placeholder: "label.buyerStreet",
        validators: [requiredValidation()]
    })
    @FormSerializable()
    street: string = "fds";

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

export class PageModel {

    @FormArray(TranslationModel)
    title: ITranslation[] = [];

    @FormArray(RichTranslationModel)
    body: ITranslation[] = [];
}

export class AddressesModel {

    @FormGroup({
        labelTemplateKey: "infoButton",
        description: "order.buyerAddress",
    })
    buyerAddress: AddressModel = new AddressModel();

    @FormArray(AddressModel, {
        removeItem: (item) => {
            return !item.street || item.street.length < 5;
        },
        validators: [requiredValidation(), arrayLengthValidation()],
        priority: -1,
        wrappers: ["form-alert"]
    })
    addresses: AddressModel[] = [new AddressModel()];

    @FormStatic()
    displayAddress: AddressModel = new AddressModel();
}

export class OrderModel {

    @FormGroup({
        asFieldSet: true
    })
    page: PageModel = new PageModel();

    @FormGroup({
        asFieldSet: true
    })
    addressing: AddressesModel = new AddressesModel();

    @FormInput({
        fieldSet: "commission",
        labelTemplateKey: "infoButton",
        description: "order.commission",
        validators: [requiredValidation()]
    })
    @FormSerializable()
    commission: string = "123 456";

    @FormInput({
        fieldSet: "commission",
        type: "date",
        max: new Date("2026-03-05"),
        validators: [requiredValidation()]
    })
    @FormSerializable()
    desiredDate: Date = new Date();

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

    // @FormInput({
    //     type: "date"
    // })
    @FormSerializable(serializeDate())
    buyerBirthday: Date = null;

    @FormInput({
        fieldSet: "contact",
        placeholder: "label.buyerEmail",
        validators: [emailValidation()]
    })
    @FormSerializable()
    buyerEmail: string = "";

    @FormInput({
        fieldSet: "contact",
        placeholder: "label.buyerPhone"
    })
    @FormSerializable()
    buyerPhone: string = "";

    @FormInput({
        fieldSet: "contact",
        placeholder: "label.buyerFax"
    })
    @FormSerializable()
    buyerFax: string = "";

    @FormInput({
        fieldSet: "contact",
        placeholder: "label.buyerMobile"
    })
    @FormSerializable()
    buyerMobile: string = "";

    @FormSelect({
        fieldSet: "contact",
        options: getPreferredContacts,
        strict: false,
        multiple: true
    })
    @FormSerializable()
    preferredContacts: string[] = [];

    @FormSelect({
        fieldSet: "contact",
        options: getPreferredContacts,
        type: "radio",
        priority: 0
    })
    @FormSerializable()
    radioContact: string = "";

    @FormInput({
        fieldSet: "testing",
        placeholder: "label.html",
        type: "wysiwyg"
    })
    @FormSerializable()
    html: string = "";

    @FormInput({
        fieldSet: "testing",
        type: "textarea",
        hidden: true
    })
    @FormSerializable()
    message: string = "";

    @FormUpload({
        fieldSet: "testing"
    })
    @FormSerializable()
    file: string = "";

    @FormStatic({
        fieldSet: "testing",
    })
    displayName: string = "Teszt Elek";

    @FormStatic({
        fieldSet: "testing",
    })
    displayImage: string = "https://picsum.photos/200/300";

    @FormArray("text", {
        fieldSet: "testing"
    })
    lines: string[] = [];

    @FormArray({
        type: "number",
        step: 0.05,
        min: 3,
        validators: [minValueValidation(5)]
    }, {
        fieldSet: "testing",
    })
    nums: number[] = [];

    constructor(data?: any) {
        if (data) Object.assign(this, data);
    }
}
