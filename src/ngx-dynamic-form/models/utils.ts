import {inject} from "@angular/core";
import {LANGUAGE_SERVICE} from "@stemy/ngx-utils";
import {FormSelectOptionsFactory} from "../common-types";

export class ModelUtils {
    static getLanguages(): FormSelectOptionsFactory {
        const language = inject(LANGUAGE_SERVICE)
        return async () => {
            return language.languages.map(id => {
                return {id, label: id};
            });
        }
    }
}
