import {Injectable} from "@angular/core";
import {from, Observable} from "rxjs";
import {
    IApiService,
    IOpenApiSchema,
    IOpenApiSchemaProperty,
    IOpenApiSchemas,
    ObjectUtils,
    ObservableUtils,
    OpenApiService,
    StringUtils
} from "@stemy/ngx-utils";
import {
    DynamicFileUploadModel,
    DynamicFileUploadModelConfig,
    DynamicFormArrayModel,
    DynamicFormArrayModelConfig,
    DynamicFormComponent,
    DynamicFormComponentService,
    DynamicFormControlModel,
    DynamicFormGroupModel,
    DynamicFormModel,
    DynamicFormService as Base,
    DynamicFormValidationService, DynamicFormValueControlModel,
    DynamicFormValueControlModelConfig,
    DynamicInputModel,
    DynamicInputModelConfig,
    DynamicSelectModel,
    DynamicSelectModelConfig,
    DynamicValidatorsConfig
} from "@ng-dynamic-forms/core";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";
import {IFormControlSerializer} from "../common-types";
import {DynamicBaseFormComponent} from "../components/base/dynamic-base-form.component";

@Injectable()
export class DynamicFormService extends Base {

    get api(): IApiService {
        return this.openApi.api;
    }

    private schemas: IOpenApiSchemas;

    constructor(cs: DynamicFormComponentService, vs: DynamicFormValidationService, readonly openApi: OpenApiService) {
        super(cs, vs);
    }

    patchGroup(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        this.patchValueRecursive(value, formModel, formGroup);
        this.detectChanges();
        formGroup.patchValue(value);
    }

    patchForm(value: any, component: DynamicFormComponent): void {
        this.patchValueRecursive(value, component.model, component.group);
        this.detectChanges(component);
        component.group.patchValue(value);
    }

    serialize(formModel: DynamicFormModel, formGroup: FormGroup): Promise<any> {
        return this.serializeRecursive(formModel, formGroup);
    }

    showErrors(form: DynamicBaseFormComponent): void {
        this.showErrorsForGroup(form.group);
        this.detectChanges(form);
    }

    protected patchValueRecursive(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        Object.keys(value).forEach(key => {
            const subModel = this.findModelById(key, formModel);
            const subValue = value[key];
            if (!subModel) return;
            const subControl = this.findControlByModel(subModel, formGroup);
            if (subModel instanceof DynamicFormArrayModel) {
                const length = Array.isArray(subValue) ? subValue.length : 0;
                const subArray = subControl as FormArray;
                while (subModel.size > length) {
                    this.removeFormArrayGroup(0, subArray, subModel);
                }
                while (subModel.size < length) {
                    this.insertFormArrayGroup(subModel.size, subArray, subModel);
                }
                for (let i = 0; i < length; i++) {
                    const itemModel = subModel.get(i);
                    this.patchValueRecursive(subValue[i], itemModel.group, subArray.at(i) as FormGroup);
                }
                return;
            }
            if (subModel instanceof DynamicFormGroupModel) {
                this.patchValueRecursive(subValue, subModel.group, subControl as FormGroup);
            }
        });
    }

    protected async serializeRecursive(formModel: DynamicFormModel, formGroup: FormGroup): Promise<any> {
        const result = {};
        if (!formModel || !formGroup || !formGroup.value) return result;
        for (const i in formModel) {
            const subModel = formModel[i] as DynamicFormValueControlModel<any>;
            const subControl = this.findControlByModel(subModel, formGroup);
            const serializer = subModel.additional?.serializer as IFormControlSerializer;
            if (ObjectUtils.isFunction(serializer)) {
                result[subModel.id] = await serializer(subModel, subControl);
                continue;
            }
            if (subModel instanceof DynamicFormArrayModel) {
                const length = Array.isArray(subControl.value) ? subControl.value.length : 0;
                const subArray = subControl as FormArray;
                const resArray = [];
                for (let i = 0; i < length; i++) {
                    const itemModel = subModel.get(i);
                    resArray.push(
                        await this.serializeRecursive(itemModel.group, subArray.at(i) as FormGroup)
                    );
                }
                result[subModel.id] = resArray;
                continue;
            }
            if (subModel instanceof DynamicFormGroupModel) {
                result[subModel.id] = this.serializeRecursive(subModel.group, subControl as FormGroup);
                continue;
            }
            result[subModel.id] = subControl.value;
        }
        return result;
    }

    protected showErrorsForGroup(formGroup: FormGroup): void {
        if (!formGroup) return;
        formGroup.markAsTouched({onlySelf: true});
        const controls = Object.keys(formGroup.controls).map(id => formGroup.controls[id]);
        this.showErrorsForControls(controls);
    }

    protected showErrorsForControls(controls: AbstractControl[]): void {
        controls.forEach(control => {
            console.log(control, control.parent);
            if (control instanceof FormGroup) {
                this.showErrorsForGroup(control);
                return;
            }
            control.markAsTouched({onlySelf: true});
            if (control instanceof FormArray) {
                this.showErrorsForControls(control.controls);
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
            case "file":
                return new DynamicFileUploadModel(this.getFormUploadConfig(property, schema));
        }
        return null;
    }

    protected getFormControlConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFormValueControlModelConfig<any> {
        const validators = this.getValidators(property, schema);
        const errorMessages = Object.keys(validators).reduce((res, key) => {
            res[key] = `error.${key}`;
            return res;
        }, {});
        return {
            id: property.id,
            label: ObjectUtils.isString(property.label) ? property.label : property.id,
            hidden: property.hidden,
            disabled: property.disabled,
            validators,
            errorMessages,
            additional: {

            }
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

    protected getFormUploadConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFileUploadModelConfig {
        const url = this.api.url(property.url || "assets");
        const {accept, autoUpload, maxSize, minSize, removeUrl, showFileList} = property;
        return Object.assign(this.getFormControlConfig(property, schema), { url, accept, autoUpload, maxSize, minSize, removeUrl, showFileList });
    }

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
        return validators;
    }
}
