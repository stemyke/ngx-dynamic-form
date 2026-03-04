import {ModelUtils} from "./utils";
import {FormInput, FormSelect, FormSerializable} from "../utils/decorators";

export class TranslationModel {

    @FormSelect({
        options: {
            type: ModelUtils,
            func: ModelUtils.getLanguages
        }
    })
    @FormSerializable()
    lang: string = "";

    @FormInput()
    @FormSerializable()
    translation: string = "";

    constructor(data?: any) {
        if (data) Object.assign(this, data);
    }
}
