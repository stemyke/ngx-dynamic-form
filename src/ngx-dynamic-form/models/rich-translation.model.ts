import {ModelUtils} from "./utils";
import {FormInput, FormSelect, FormSerializable} from "../utils/decorators";

export class RichTranslationModel {

    @FormSelect({
        options: {
            type: ModelUtils,
            func: ModelUtils.getLanguages
        }
    })
    @FormSerializable()
    lang: string = "";

    @FormInput({
        type: "wysiwyg"
    })
    @FormSerializable()
    translation: string = "";

    constructor(data?: any) {
        if (data) Object.assign(this, data);
    }
}
