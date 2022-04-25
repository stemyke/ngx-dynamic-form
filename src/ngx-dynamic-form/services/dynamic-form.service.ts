import {EventEmitter, Injectable} from "@angular/core";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";
import {Subject} from "rxjs";
import {
    DynamicCheckboxModel,
    DynamicCheckboxModelConfig,
    DynamicFileUploadModel,
    DynamicFileUploadModelConfig,
    DynamicFormComponent,
    DynamicFormComponentService,
    DynamicFormControlModel,
    DynamicFormGroupModel,
    DynamicFormGroupModelConfig,
    DynamicFormModel,
    DynamicFormOptionConfig,
    DynamicFormService as Base,
    DynamicFormValidationService,
    DynamicFormValueControlModel,
    DynamicFormValueControlModelConfig,
    DynamicInputModel,
    DynamicInputModelConfig,
    DynamicSelectModel,
    DynamicSelectModelConfig,
    DynamicTextAreaModel,
    DynamicTextAreaModelConfig,
    DynamicValidatorsConfig,
    DynamicFormArrayModel as DynamicFormArrayModelBase
} from "@ng-dynamic-forms/core";
import {
    IApiService,
    ILanguageService,
    IOpenApiSchema,
    IOpenApiSchemaProperty,
    IOpenApiSchemas,
    ObjectUtils,
    OpenApiService,
    StringUtils
} from "@stemy/ngx-utils";

import {IFormControlSerializer} from "../common-types";

import {FormSubject} from "../utils/form-subject";
import {DynamicFormArrayModel, DynamicFormArrayModelConfig} from "../utils/dynamic-form-array.model";

@Injectable()
export class DynamicFormService extends Base {

    get api(): IApiService {
        return this.openApi.api;
    }

    get language(): ILanguageService {
        return this.api.language;
    }

    readonly onDetectChanges: EventEmitter<DynamicFormComponent>;
    protected schemas: IOpenApiSchemas;

    constructor(cs: DynamicFormComponentService, vs: DynamicFormValidationService, readonly openApi: OpenApiService) {
        super(cs, vs);
        this.onDetectChanges = new EventEmitter<DynamicFormComponent>();
    }

    patchGroup(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        this.patchValueRecursive(value, formModel, formGroup);
        this.detectChanges();
        formGroup.patchValue(ObjectUtils.copy(value));
    }

    patchForm(value: any, component: DynamicFormComponent): void {
        this.patchValueRecursive(value, component.model, component.group);
        this.detectChanges(component);
        component.group.patchValue(value);
    }

    serialize(formModel: DynamicFormModel, formGroup: FormGroup): Promise<any> {
        return this.serializeRecursive(formModel, formGroup);
    }

    notifyChanges(formModel: DynamicFormModel, formGroup: FormGroup): void {
        this.notifyChangesRecursive(formModel, formGroup);
    }

    updateSelectOptions(formControlModel: DynamicFormControlModel, formControl: AbstractControl): void {
        if (formControlModel instanceof DynamicSelectModel) {
            let options = formControlModel.options$;
            if (options instanceof FormSubject) {
                options.notify(formControlModel, formControl);
                return;
            }
            while (options instanceof Subject && options.source) {
                options = options.source;
                if (options instanceof FormSubject) {
                    options.notify(formControlModel, formControl);
                }
            }
        }
    }

    showErrors(form: DynamicFormComponent): void {
        this.showErrorsForGroup(form.group);
        this.detectChanges(form);
    }

    detectChanges(formComponent?: DynamicFormComponent) {
        super.detectChanges(formComponent);
        this.onDetectChanges.emit(formComponent);
    }

    protected patchValueRecursive(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        Object.keys(value).forEach(key => {
            const subModel = this.findModelById(key, formModel);
            const subValue = value[key];
            if (!subModel) return;
            const subControl = this.findControlByModel(subModel, formGroup);
            if (subModel instanceof DynamicSelectModel && ObjectUtils.isObject(subValue)) {
                value[key] = subValue.id || subValue._id || subValue;
                return;
            }
            if (subModel instanceof DynamicFormArrayModelBase) {
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
            if (subModel instanceof DynamicFormArrayModelBase) {
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
                result[subModel.id] = await this.serializeRecursive(subModel.group, subControl as FormGroup);
                continue;
            }
            if (subModel instanceof DynamicInputModel && !ObjectUtils.isNullOrUndefined(subControl.value)) {
                result[subModel.id] = subModel.inputType == "number"
                    ? parseFloat((`${subControl.value}` || "0").replace(/,/gi, ".")) ?? null
                    : subControl.value;
                continue;
            }
            result[subModel.id] = subControl.value;
        }
        return result;
    }

    protected notifyChangesRecursive(formModel: DynamicFormModel, formGroup: FormGroup): void {
        if (!formModel || !formGroup) return;
        for (const i in formModel) {
            const subModel = formModel[i] as DynamicFormValueControlModel<any>;
            const subControl = this.findControlByModel(subModel, formGroup);
            if (subModel instanceof DynamicFormArrayModelBase) {
                const length = Array.isArray(subControl.value) ? subControl.value.length : 0;
                const subArray = subControl as FormArray;
                for (let i = 0; i < length; i++) {
                    const itemModel = subModel.get(i);
                    this.notifyChangesRecursive(itemModel.group, subArray.at(i) as FormGroup);
                }
                continue;
            }
            if (subModel instanceof DynamicFormGroupModel) {
                this.notifyChangesRecursive(subModel.group, subControl as FormGroup);
                continue;
            }
            this.updateSelectOptions(subModel, subControl);
        }
    }

    protected showErrorsForGroup(formGroup: FormGroup): void {
        if (!formGroup) return;
        formGroup.markAsTouched({onlySelf: true});
        const controls = Object.keys(formGroup.controls).map(id => formGroup.controls[id]);
        this.showErrorsForControls(controls);
    }

    protected showErrorsForControls(controls: AbstractControl[]): void {
        controls.forEach(control => {
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
        if (Array.isArray(property.enum) || ObjectUtils.isString(property.optionsPath)) {
            return new DynamicSelectModel<any>(this.getFormSelectConfig(property, schema));
        }
        switch (property.type) {
            case "string":
            case "number":
            case "integer":
                return new DynamicInputModel(this.getFormInputConfig(property, schema));
            case "textarea":
                return new DynamicTextAreaModel(this.getFormTextareaConfig(property, schema));
            case "boolean":
                return new DynamicCheckboxModel(this.getFormCheckboxConfig(property, schema));
            case "list":
                return new DynamicSelectModel<any>(this.getFormSelectConfig(property, schema));
            case "array":
                if (property.items?.$ref || property.$ref) {
                    return new DynamicFormArrayModel(this.getFormArrayConfig(property, schema));
                } else if (property.items?.enum || property.enum) {
                    return new DynamicSelectModel<any>(this.getFormSelectConfig(property, schema));
                } else {
                    return new DynamicInputModel(this.getFormInputConfig(property, schema));
                }
            case "file":
                return new DynamicFileUploadModel(this.getFormUploadConfig(property, schema));
        }
        if (property.$ref) {
            return new DynamicFormGroupModel(this.getFormGroupConfig(property, schema));
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
            additional: Object.assign({}, property)
        };
    }

    protected getFormArrayConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFormArrayModelConfig {
        const ref = property.items?.$ref || property.$ref || "";
        const subSchema = this.schemas[ref.split("/").pop()];
        return Object.assign(this.getFormControlConfig(property, schema), {groupFactory: () => this.getFormModelForSchemaDef(subSchema)});
    }

    protected getFormGroupConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFormGroupModelConfig {
        const ref = property.$ref || "";
        const subSchema = this.schemas[ref.split("/").pop()];
        return Object.assign(this.getFormControlConfig(property, schema), {group: this.getFormModelForSchemaDef(subSchema)});
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
            case "integer":
                inputType = "number";
                break;
        }
        const sub = property.type == "array" ? property.items || property : property;
        return Object.assign(
            this.getFormControlConfig(property, schema),
            {
                inputType,
                autoComplete: property.autoComplete || "off",
                multiple: property.type == "array",
                accept: ObjectUtils.isString(property.accept) ? property.accept : null,
                mask: ObjectUtils.isString(property.mask) ? property.mask : null,
                pattern: ObjectUtils.isString(property.pattern) ? property.pattern : null,
                step: isNaN(sub.step) ? (isNaN(property.step) ? 1 : property.step) : sub.step,
                min: isNaN(sub.minimum) ? (isNaN(sub.minLength) ? Number.MIN_SAFE_INTEGER : sub.minLength) : sub.minimum,
                max: isNaN(sub.maximum) ? (isNaN(sub.maxLength) ? Number.MAX_SAFE_INTEGER : sub.maxLength) : sub.maximum
            }
        );
    }

    protected getFormTextareaConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicTextAreaModelConfig {
        return Object.assign(
            this.getFormControlConfig(property, schema),
            {
                cols: property.cols || null,
                rows: property.rows || 10,
                wrap: property.wrap || false,
                autoComplete: property.autoComplete || "off",
                multiple: property.type == "array"
            }
        );
    }

    protected getFormSelectConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicSelectModelConfig<any> {
        return Object.assign(
            this.getFormControlConfig(property, schema),
            {
                options: this.getFormSelectOptions(property, schema),
                multiple: property.type == "array"
            }
        );
    }

    protected getFormCheckboxConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicCheckboxModelConfig {
        return Object.assign(
            this.getFormControlConfig(property, schema),
            {
                indeterminate: property.indeterminate === true
            }
        );
    }

    protected async translateOptions(options: DynamicFormOptionConfig<any>[]): Promise<DynamicFormOptionConfig<any>[]> {
        if (!options) return [];
        for (const option of options) {
            option.label = await this.language.getTranslation(option.label);
        }
        return options;
    }

    protected getFormSelectOptions(property: IOpenApiSchemaProperty, schema: IOpenApiSchema) {
        const $enum = property.items?.enum || property.enum;
        if (property.optionsPath) {
            return new FormSubject((formModel, control) => {
                let path = property.optionsPath;
                let target = control;
                if (path.startsWith("$root")) {
                    path = path.substr(5);
                    while (target.parent) {
                        target = target.parent;
                    }
                }
                while (path.startsWith(".")) {
                    path = path.substr(1);
                    if (target.parent) {
                        target = target.parent;
                    }
                }
                const value = ObjectUtils.getValue(target.value, path);
                const options = (!ObjectUtils.isArray(value) ? []: value).map(value => ({value, label: value}));
                return this.translateOptions(options);
            });
        }
        if (ObjectUtils.isArray($enum)) {
            return new FormSubject(() => {
                const options = $enum.map(value => {
                    const label = property.translatable ? `${property.id}.${value}` : value;
                    return {value, label};
                });
                return this.translateOptions(options);
            });
        }
        return new FormSubject(async () => {
            this.api.cache[property.endpoint] = this.api.cache[property.endpoint] || this.api.list(property.endpoint, this.api.makeListParams(1, -1)).then(result => {
                return result.items.map(i => {
                    return {value: i.id || i._id, label: i[property.labelField] || i.label || i.id || i._id};
                });
            });
            const options = (await this.api.cache[property.endpoint]).map(t => Object.assign({}, t));
            return this.translateOptions(options);
        });
    }

    protected getFormUploadConfig(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicFileUploadModelConfig {
        const url = this.api.url(property.url || "assets");
        const {accept, autoUpload, maxSize, minSize, removeUrl, showFileList} = property;
        return Object.assign(this.getFormControlConfig(property, schema), {
            url,
            accept,
            autoUpload,
            maxSize,
            minSize,
            removeUrl,
            showFileList
        });
    }

    protected getValidators(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): DynamicValidatorsConfig {
        const validators: DynamicValidatorsConfig = {};
        if (ObjectUtils.isArray(schema.required) && schema.required.indexOf(property.id) >= 0) {
            validators.required = null;
        }
        this.addPropertyValidators(validators, property);
        this.addItemsValidators(validators, property.items);
        return validators;
    }

    protected addPropertyValidators(validators: DynamicValidatorsConfig, property: IOpenApiSchemaProperty): void {
        if (!property) return;
        if (!isNaN(property.minLength)) {
            validators.minLength = property.minLength;
        }
        if (!isNaN(property.maxLength)) {
            validators.maxLength = property.maxLength;
        }
        if (!isNaN(property.minimum)) {
            validators.min = property.minimum;
        }
        if (!isNaN(property.maximum)) {
            validators.max = property.maximum;
        }
        switch (property.format) {
            case "email":
                validators.email = null;
                break;
        }
    }

    protected addItemsValidators(validators: DynamicValidatorsConfig, items: IOpenApiSchemaProperty): void {
        if (!items) return;
        if (!isNaN(items.minLength)) {
            validators.itemsMinLength = items.minLength;
        }
        if (!isNaN(items.maxLength)) {
            validators.itemsMaxLength = items.maxLength;
        }
        if (!isNaN(items.minimum)) {
            validators.itemsMinValue = items.minimum;
        }
        if (!isNaN(items.maximum)) {
            validators.itemsMaxValue = items.maximum;
        }
    }
}
