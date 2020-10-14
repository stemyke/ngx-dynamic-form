import {Injectable} from "@angular/core";
import {from, Observable} from "rxjs";
import {
    IApiService,
    IOpenApiSchema,
    IOpenApiSchemaProperty,
    IOpenApiSchemas, ObservableUtils,
    OpenApiService,
    StringUtils
} from "@stemy/ngx-utils";
import {
    DynamicFormArrayModel,
    DynamicFormArrayModelConfig,
    DynamicFormComponentService,
    DynamicFormControlModel, DynamicFormGroupModel,
    DynamicFormModel,
    DynamicFormService as Base,
    DynamicFormValidationService,
    DynamicFormValueControlModelConfig,
    DynamicInputModel,
    DynamicInputModelConfig,
    DynamicSelectModel,
    DynamicSelectModelConfig,
    DynamicValidatorsConfig
} from "@ng-dynamic-forms/core";
import {FormArray, FormGroup} from "@angular/forms";

@Injectable()
export class DynamicFormService extends Base {

    get api(): IApiService {
        return this.openApi.api;
    }

    private schemas: IOpenApiSchemas;

    constructor(cs: DynamicFormComponentService, vs: DynamicFormValidationService, readonly openApi: OpenApiService) {
        super(cs, vs);
    }

    patchValue(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        this.patchValueRecursive(value, formModel, formGroup);
        formGroup.patchValue(value);
    }

    protected patchValueRecursive(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        Object.keys(value).forEach(key => {
            const subModel = this.findModelById(key, formModel);
            const subValue = value[key];
            if (!subModel) return;
            const subGroup = this.findControlByModel(subModel, formGroup);
            if (subModel instanceof DynamicFormArrayModel) {
                const length = Array.isArray(subValue) ? subValue.length : 0;
                const subArray = subGroup as FormArray;
                while (subModel.size > length) {
                    this.removeFormArrayGroup(0, subArray, subModel);
                }
                while (subModel.size < length) {
                    this.insertFormArrayGroup(subModel.size, subArray, subModel);
                }
                this.detectChanges();
                for (let i = 0; i < length; i++) {
                    const itemModel = subModel.get(i);
                    this.patchValueRecursive(subValue[i], itemModel.group, subArray.at(i) as FormGroup);
                }
                return;
            }
            if (subModel instanceof DynamicFormGroupModel) {
                this.patchValueRecursive(subValue, subModel.group, subGroup as FormGroup);
            }
        });
    }

    async getFormModelForSchema(name: string): Promise<DynamicFormModel> {
        this.api.cache = {};
        this.schemas = await this.openApi.getSchemas();
        return this.getFormModelForSchemaDef(this.schemas[name]);
    }

    protected getFormModelForSchemaDef(schema: IOpenApiSchema): DynamicFormModel {
        if (!schema)
            return [];
        return Object.keys(schema.properties || {}).map(p => {
            const property = schema.properties[p];
            return this.getFormControlModel(property, schema);
        }).filter(t => null !== t);
    }

    protected getFormControlModel(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFormControlModel {
        if (Array.isArray(property.enum)) {
            return new DynamicSelectModel<any>(this.getFormSelectConfig(property, schema));
        }
        switch (property.type) {
            case "string":
            case "number":
            case "boolean":
            case "textarea":
                return new DynamicInputModel(this.getFormInputConfig(property, schema));
            case "list":
                return new DynamicSelectModel<any>(this.getFormSelectConfig(property, schema));
            case "array":
                if (property.items?.$ref || property.$ref) {
                    return new DynamicFormArrayModel(this.getFormArrayConfig(property, schema));
                } else {
                    return new DynamicInputModel(this.getFormInputConfig(property, schema));
                }
            // case "file":
            //     return createFormFile(property.id, this.getFormFileData(property, schema));
        }
        return null;
    }

    protected getFormControlConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFormValueControlModelConfig<any> {
        return {
            id: property.id,
            label: property.id,
            // readonly: property.readonly ? FormUtilities.readonly : null,
            // shouldSerialize: FormUtilities.checkReadonly,
            validators: this.getValidators(property, schema)
        };
    }

    protected getFormArrayConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFormArrayModelConfig {
        const ref = property.items?.$ref || property.$ref || "";
        const subSchema = this.schemas[ref.split("/").pop()];
        return Object.assign(this.getFormControlConfig(property, schema), { groupFactory: () => this.getFormModelForSchemaDef(subSchema) });
    }

    protected getFormInputConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicInputModelConfig {
        let inputType = StringUtils.has(property.id, "password", "Password") ? "password" : (property.items?.type || property.type);
        switch (inputType) {
            case "boolean":
                inputType = "checkbox";
                break;
            case "textarea":
                inputType = "textarea";
                break;
        }
        return Object.assign(this.getFormControlConfig(property, schema), { inputType, multiple: property.type == "array" });
    }

    protected getFormSelectConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicSelectModelConfig<any> {
        const options = Array.isArray(property.enum)
            ? from(property.enum.map(id => ({ id, label: `${property.id}.${id}` }))) as Observable<any>
            : ObservableUtils.fromFunction(() => {
                this.api.cache[property.endpoint] = this.api.cache[property.endpoint] || this.api.list(property.endpoint, this.api.makeListParams(1, -1)).then(result => {
                    return result.items.map(i => {
                        return { id: i._id, label: i.name };
                    });
                });
                return this.api.cache[property.endpoint];
            })
        return Object.assign(this.getFormControlConfig(property, schema), { options });
    }

    // protected getFormFileData(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): IFormFileData {
    //     return Object.assign(Object.assign({}, this.getBaseFormData(property, schema)), { multi: property.multi });
    // }

    protected getValidators(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicValidatorsConfig {
        const validators: DynamicValidatorsConfig = {};
        if (schema.required.indexOf(property.id) >= 0) {
            validators.required = null;
        }
        if (property.minLength) {
            validators.minLength = property.minLength;
        }
        if (property.maxLength) {
            validators.maxLength = property.maxLength;
        }
        if (property.min) {
            validators.min = property.min;
        }
        if (property.max) {
            validators.max = property.max;
        }
        switch (property.format) {
            case "email":
                validators.email = null;
                break;
        }
        return {};
    }
}
