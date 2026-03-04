import {FactoryDependencies, API_SERVICE, IApiService, ILanguageService, LANGUAGE_SERVICE} from "@stemy/ngx-utils";
import {FormSelectOptionsFactory} from "../common-types";

export class ModelUtils {
    @FactoryDependencies(LANGUAGE_SERVICE)
    static getLanguages(language: ILanguageService): FormSelectOptionsFactory {
        return async () => {
            return language.languages.map(id => {
                return {id, label: id};
            });
        }
    }
}
