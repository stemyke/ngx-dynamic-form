import {Inject, Injectable, Injector} from "@angular/core";
import {AbstractControl, AbstractControlOptions, FormArray, FormControl, FormGroup} from "@angular/forms";
import {firstValueFrom, Subject} from "rxjs";
import {debounceTime, first} from "rxjs/operators";
import {
    DynamicCheckboxModel,
    DynamicCheckboxModelConfig,
    DynamicDatePickerModel,
    DynamicDatePickerModelConfig,
    DynamicFileUploadModel,
    DynamicFileUploadModelConfig,
    DynamicFormComponentService,
    DynamicFormControlModel,
    DynamicFormModel,
    DynamicFormService as Base,
    DynamicFormValidationService,
    DynamicFormValueControlModel,
    DynamicFormValueControlModelConfig,
    DynamicInputModel,
    DynamicInputModelConfig,
    DynamicPathable,
    DynamicRadioGroupModel,
    DynamicRadioGroupModelConfig,
    DynamicTextAreaModel,
    DynamicTextAreaModelConfig,
    DynamicValidatorsConfig, isString,
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

import {
    FormControlSerializer,
    FormModelCustomizer,
    IDynamicForm,
    ModelForSchemaOptions,
    ModelForSchemaWrapOptions
} from "../common-types";

import {EDITOR_FORMATS, findRefs, isStringWithVal, MAX_INPUT_NUM, mergeFormModels, MIN_INPUT_NUM} from "../utils/misc";
import {FormSelectSubject} from "../utils/form-select-subject";
import {FormSubject} from "../utils/form-subject";
import {DynamicEditorModel, DynamicEditorModelConfig} from "../utils/dynamic-editor.model";
import {
    DynamicFormArrayGroupModel,
    DynamicFormArrayModel,
    DynamicFormArrayModelConfig
} from "../utils/dynamic-form-array.model";
import {
    DynamicFormFieldSet,
    DynamicFormGroupModel,
    DynamicFormGroupModelConfig
} from "../utils/dynamic-form-group.model";
import {DynamicFormOptionConfig, DynamicSelectModel, DynamicSelectModelConfig} from "../utils/dynamic-select.model";
import {createFormInput} from "../utils/creators";
import {AllValidationErrors, getFormValidationErrors} from "../utils/validation-errors";

@Injectable()
export class DynamicFormService extends Base {

    get api(): IApiService {
        return this.openApi.api;
    }

    get language(): ILanguageService {
        return this.api.language;
    }

    protected schemas: IOpenApiSchemas;

    constructor(cs: DynamicFormComponentService,
                vs: DynamicFormValidationService,
                @Inject(OpenApiService) readonly openApi: OpenApiService,
                @Inject(Injector) readonly injector: Injector) {
        super(cs, vs);
    }

    async serializeForm(form: IDynamicForm, validate?: boolean): Promise<any> {
        if (!form.group) return null;
        if (validate) {
            await this.validateForm(form);
        }
        return this.serialize(form.model, form.group);
    }

    async getFormModelForSchema(name: string, customizeOrOptions?: FormModelCustomizer | ModelForSchemaOptions): Promise<DynamicFormModel> {
        return (await this.getFormGroupModelForSchema(name, customizeOrOptions)).group;
    }

    getErrors(form: IDynamicForm): Promise<AllValidationErrors[]> {
        this.showErrors(form);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(getFormValidationErrors(form.group.controls, ""));
            }, 500);
        });
    }

    createFormGroup(formModel: DynamicFormModel, options?: AbstractControlOptions | null, parent?: DynamicPathable | null) {
        const group = super.createFormGroup(formModel, options, parent);
        if (!parent) {
            group.valueChanges.pipe(debounceTime(500)).subscribe(() => {
                this.notifyChanges(formModel, group, formModel);
            });
        }
        return group;
    }

    patchGroup(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        value = ObjectUtils.copy(value);
        this.patchValues(value, formModel, formGroup);
        formGroup.patchValue(value);
        this.detectChanges();
    }

    patchForm(value: any, component: IDynamicForm): void {
        value = ObjectUtils.copy(value);
        this.patchValues(value, component.model, component.group);
        component.group.patchValue(value);
        this.detectChanges(component);
    }

    validateForm(form: IDynamicForm, showErrors: boolean = true): Promise<any> {
        if (!form.group) return Promise.resolve();
        return new Promise<any>((resolve, reject) => {
            form.group.statusChanges.pipe(first(status => status == "VALID" || status == "INVALID")).subscribe(status => {
                if (showErrors) {
                    this.showErrors(form);
                }
                if (status == "VALID") {
                    resolve(null);
                    return;
                }
                console.log(`Form errors:`, getFormValidationErrors(form.group.controls));
                reject(null);
            });
            form.group.updateValueAndValidity();
        });
    }

    async serialize(formModel: DynamicFormModel, formGroup: FormGroup): Promise<any> {
        const result = {};
        if (!formModel || !formGroup || !formGroup.value) return result;
        for (const i in formModel) {
            const subModel = formModel[i] as DynamicFormValueControlModel<any>;
            const subControl = this.findControlByModel(subModel, formGroup);
            const serializer = subModel.additional?.serializer as FormControlSerializer;
            if (ObjectUtils.isFunction(serializer)) {
                result[subModel.id] = await serializer(subModel, subControl);
                continue;
            }
            if (subModel.hidden && !subModel.additional?.serialize) continue;
            if (subModel instanceof DynamicFormArrayModel) {
                const length = Array.isArray(subControl.value) ? subControl.value.length : 0;
                const subArray = subControl as FormArray;
                const resArray = [];
                for (let i = 0; i < length; i++) {
                    const itemModel = subModel.get(i);
                    resArray.push(
                        await this.serialize(itemModel.group, subArray.at(i) as FormGroup)
                    );
                }
                result[subModel.id] = resArray;
                continue;
            }
            if (subModel instanceof DynamicInputModel && !ObjectUtils.isNullOrUndefined(subControl.value)) {
                result[subModel.id] = subModel.inputType == "number"
                    ? parseFloat((`${subControl.value}` || "0").replace(/,/gi, ".")) ?? null
                    : subControl.value;
                continue;
            }
            if (subModel instanceof DynamicFormGroupModel) {
                result[subModel.id] = await this.serialize(subModel.group, subControl as FormGroup);
                continue;
            }
            result[subModel.id] = subControl.value;
        }
        return result;
    }

    showErrors(form: IDynamicForm): void {
        this.showErrorsForGroup(form.group);
        this.detectChanges(form);
    }

    notifyChanges(formModel: DynamicFormModel, formGroup: FormGroup, root: DynamicFormModel): void {
        if (!formModel || !formGroup) return;
        for (const i in formModel) {
            const subModel = formModel[i] as DynamicFormValueControlModel<any>;
            const subControl = this.findControlByModel(subModel, formGroup);
            if (subModel instanceof DynamicFormArrayModel) {
                const length = Array.isArray(subControl.value) ? subControl.value.length : 0;
                const subArray = subControl as FormArray;
                for (let i = 0; i < length; i++) {
                    const itemModel = subModel.get(i);
                    this.notifyChanges(itemModel.group, subArray.at(i) as FormGroup, root);
                }
                continue;
            }
            if (subModel instanceof DynamicFormGroupModel) {
                this.notifyChanges(subModel.group, subControl as FormGroup, root);
                continue;
            }
            this.updateSelectOptions(subModel, subControl as FormControl, root);
        }
    }

    protected patchValues(value: any, formModel: DynamicFormModel, formGroup: FormGroup): void {
        if (!value) return;
        formModel?.forEach(subModel => {
            const key = subModel.id;
            const subValue = value[key];
            const subControl = this.findControlByModel(subModel, formGroup);
            if ((subModel instanceof DynamicSelectModel || subModel instanceof DynamicRadioGroupModel) && ObjectUtils.isObject(subValue)) {
                value[key] = subValue.id || subValue._id || subValue;
                return;
            }
            if (subModel instanceof DynamicDatePickerModel) {
                value[key] = this.convertToDate(subValue);
                return;
            }
            if (subModel instanceof DynamicFormArrayModel) {
                const length = Array.isArray(subValue) ? subValue.length : 0;
                const subArray = subControl as FormArray;
                while (subModel.size > length) {
                    this.removeFormArrayGroup(0, subArray, subModel);
                }
                while (subModel.size < length) {
                    this.insertFormArrayGroup(subModel.size, subArray, subModel as DynamicFormArrayModel);
                }
                for (let i = 0; i < length; i++) {
                    const itemModel = subModel.get(i);
                    this.patchValues(subValue[i], itemModel.group, subArray.at(i) as FormGroup);
                }
                return;
            }
            if (subModel instanceof DynamicFormGroupModel) {
                this.patchValues(subValue, subModel.group, subControl as FormGroup);
            }
        });
    }

    protected updateSelectOptions(formControlModel: DynamicFormControlModel, formControl: FormControl, root: DynamicFormModel): void {
        if (formControlModel instanceof DynamicSelectModel) {
            let options = formControlModel.options$;
            if (options instanceof FormSubject) {
                options.notify(formControlModel, formControl, root);
                return;
            }
            while (options instanceof Subject && options.source) {
                options = options.source;
                if (options instanceof FormSubject) {
                    options.notify(formControlModel, formControl, root);
                }
            }
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

    protected convertToDate(value: any): Date {
        if (ObjectUtils.isNullOrUndefined(value)) return null;
        const date = ObjectUtils.isDate(value)
            ? value
            : new Date(value);
        return isNaN(date as any) ? new Date() : date;
    }

    async getFormGroupModelForSchema(name: string, customizeOrOptions?: FormModelCustomizer | ModelForSchemaOptions): Promise<DynamicFormGroupModel> {
        this.api.cache = {};
        this.schemas = await this.openApi.getSchemas();
        const fieldSets: DynamicFormFieldSet<string>[] = [];
        const schemaOptions = ObjectUtils.isObject(customizeOrOptions) ? customizeOrOptions as ModelForSchemaOptions : {};
        const customizeModel = ObjectUtils.isFunction(customizeOrOptions) ? customizeOrOptions : schemaOptions.customizer;
        const schema = this.schemas[name];
        const wrapOptions = {
            ...schemaOptions,
            schema,
            customizer: async (property, options, modelType, config, path: string) => {
                const pathPrefix = !path ? `` : `${path}.`;
                config.label = !config.label || !options.labelPrefix
                    ? config.label || ""
                    : await this.language.getTranslation(`${options.labelPrefix}.${pathPrefix}${config.label}`);
                const model = new modelType(config);
                if (model instanceof DynamicFormValueControlModel) {
                    model.value = (model instanceof DynamicDatePickerModel)
                        ? this.convertToDate(property.default) : property.default;
                }
                const modelPath = `${pathPrefix}${model.id}`;
                const layout = modelPath.toLowerCase().replace(/\./g, "-");
                model.layout = {
                    grid: {
                        host: `${layout} control-${model.id}`,
                        container: `${layout}-container`
                    }
                };
                if (!ObjectUtils.isFunction(customizeModel)) return [model];
                let res = customizeModel(property, schema, model, config, modelPath, this.injector);
                if (!res) return [model];
                if (res instanceof Promise) {
                    res = await res;
                }
                return Array.isArray(res) ? res : [res];
            }
        } as ModelForSchemaWrapOptions;
        const controls = await this.getFormModelForSchemaDef(schema, fieldSets, wrapOptions, "");
        const group = [...controls];
        // Add id fields if necessary
        if (controls.length > 0) {
            const idFields = [
                createFormInput("id", {hidden: true}),
                createFormInput("_id", {hidden: true})
            ].filter(t => !controls.some(c => c.id == t.id));
            group.unshift(...idFields);
        }
        const config = {
            id: "root",
            group,
            fieldSets
        } as DynamicFormGroupModelConfig;
        const root = await wrapOptions.customizer({
            id: "root",
            type: "object",
            properties: schema?.properties || {}
        }, wrapOptions, DynamicFormGroupModel, config, "");
        // Check if the customized root wrapper returned an array
        controls.length = 0;
        for (const model of root) {
            if (model instanceof DynamicFormGroupModel && model.id === "root") {
                return model;
            } else {
                controls.push(model);
            }
        }
        return new DynamicFormGroupModel({
            ...config,
            group: controls
        });
    }

    protected async getFormModelForSchemaDef(schema: IOpenApiSchema, fieldSets: DynamicFormFieldSet<string>[], options: ModelForSchemaWrapOptions, path: string): Promise<DynamicFormModel> {
        if (!schema)
            return [];
        const keys = Object.keys(schema.properties || {});
        const controls: DynamicFormModel = [];
        for (const p of keys) {
            const property = schema.properties[p];
            const fsName = property.hidden ? null : String(property.fieldSet || "");
            if (fsName) {
                const fs = fieldSets.find(t => t.id === fsName);
                if (fs) {
                    fs.fields.push(p);
                } else {
                    fieldSets.push({id: fsName, legend: `legend.${fsName}`, fields: [p]});
                }
            }
            const models = await this.getFormControlModels(property, options, path);
            controls.push(...models);
        }
        return controls.filter(t => null !== t);
    }

    protected checkIsEditorProperty(property: IOpenApiSchemaProperty): boolean {
        if (!property.format) return false;
        return EDITOR_FORMATS.indexOf(property.format) >= 0 || property.format.endsWith("script");
    }

    protected async getFormControlModels(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions, path: string): Promise<DynamicFormControlModel[]> {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum) || isStringWithVal(property.optionsPath) || isStringWithVal(property.endpoint)) {
            if (property.format == "radio") {
                return options.customizer(property, options, DynamicRadioGroupModel, this.getFormRadioConfig(property, options), path);
            }
            return options.customizer(property, options, DynamicSelectModel, this.getFormSelectConfig(property, options), path);
        }
        switch (property.type) {
            case "string":
            case "number":
            case "integer":
            case "textarea":
                if (this.checkIsEditorProperty(property)) {
                    return options.customizer(property, options, DynamicEditorModel, this.getFormEditorConfig(property, options), path);
                }
                if (property.format == "textarea") {
                    return options.customizer(property, options, DynamicTextAreaModel, this.getFormTextareaConfig(property, options), path);
                }
                if (property.format == "date" || property.format == "date-time") {
                    return options.customizer(property, options, DynamicDatePickerModel, this.getFormDatepickerConfig(property, options), path);
                }
                return options.customizer(property, options, DynamicInputModel, this.getFormInputConfig(property, options), path);
            case "object":
                return options.customizer(property, options, DynamicEditorModel, this.getFormEditorConfig(property, options), path);
            case "boolean":
                return options.customizer(property, options, DynamicCheckboxModel, this.getFormCheckboxConfig(property, options), path);
            case "array":
                if (findRefs(property).length > 0) {
                    return options.customizer(property, options, DynamicFormArrayModel, await this.getFormArrayConfig(property, options, path), path);
                } else {
                    return options.customizer(property, options, DynamicInputModel, this.getFormInputConfig(property, options), path);
                }
            case "file":
                return options.customizer(property, options, DynamicFileUploadModel, this.getFormUploadConfig(property, options), path);
        }
        if (findRefs(property).length > 0) {
            return options.customizer(
                property, options, DynamicFormGroupModel,
                await this.getFormGroupConfig(property, options, !path ? property.id : `${path}.${property.id}`),
                path
            );
        }
        return [];
    }

    findModelByPath(parent: DynamicPathable | DynamicFormModel, path: string[]): DynamicPathable {
        if (path.length == 0) return parent as DynamicPathable;
        const next = path.shift() as any;
        if (Array.isArray(parent)) {
            return this.findModelByPath(parent.find(t => t.id == next), path);
        }
        if (parent instanceof DynamicFormGroupModel || parent instanceof DynamicFormArrayGroupModel) {
            return this.findModelByPath(parent.group.find(t => t.id == next), path);
        }
        if (parent instanceof DynamicFormArrayModel) {
            return this.findModelByPath(parent.groups.find(t => t.index == next), path);
        }
        return parent;
    }

    getFormControlConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicFormValueControlModelConfig<any> {
        const validators = this.getValidators(property, options);
        const errorMessages = Object.keys(validators).reduce((res, key) => {
            res[key] = options.labelPrefix
                ? this.language.getTranslationSync(`${options.labelPrefix}.error.${key}`) : `error.${key}`;
            return res;
        }, {});
        return {
            id: property.id,
            label: ObjectUtils.isString(property.label) ? property.label : property.id,
            hidden: property.hidden,
            disabled: property.disabled,
            validators,
            errorMessages,
            additional: Object.assign({
                // For material components
                appearance: "fill"
            }, property)
        };
    }

    async getFormArrayConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions, path: string): Promise<DynamicFormArrayModelConfig> {
        const fieldSets: DynamicFormFieldSet<string>[] = [];
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        const subModels = await Promise.all(
            subSchemas.map(s => this.getFormModelForSchemaDef(s, fieldSets, options, path))
        );
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                groupFactory: () => mergeFormModels(ObjectUtils.copy(subModels)),
                initialCount: property.initialCount || 0,
                sortable: property.sortable || false,
                useTabs: property.useTabs || false,
                addItem: property.addItem !== false,
                insertItem: property.insertItem !== false,
                cloneItem: property.cloneItem !== false,
                moveItem: property.moveItem !== false,
                removeItem: property.removeItem !== false,
                clearItems: property.clearItems !== false
            }
        );
    }

    async getFormGroupConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions, path: string): Promise<DynamicFormGroupModelConfig> {
        const fieldSets: DynamicFormFieldSet<string>[] = [];
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        const subModels = await Promise.all(
            subSchemas.map(s => this.getFormModelForSchemaDef(s, fieldSets, options, path))
        );
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                fieldSets,
                group: mergeFormModels(subModels)
            }
        );
    }

    getFormInputConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicInputModelConfig {
        let inputType = StringUtils.has(property.id, "password", "Password") ? "password" : (property.format || property.items?.type || property.type);
        switch (inputType) {
            case "string":
                inputType = "text";
                break;
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
            this.getFormControlConfig(property, options),
            {
                inputType,
                autoComplete: property.autoComplete || "off",
                multiple: property.type == "array",
                accept: ObjectUtils.isString(property.accept) ? property.accept : null,
                mask: ObjectUtils.isString(property.mask) ? property.mask : null,
                pattern: ObjectUtils.isString(property.pattern) ? property.pattern : null,
                step: isNaN(sub.step) ? (isNaN(property.step) ? 1 : property.step) : sub.step,
                min: isNaN(sub.minimum) ? MIN_INPUT_NUM : sub.minimum,
                max: isNaN(sub.maximum) ? MAX_INPUT_NUM : sub.maximum,
                minLength: isNaN(sub.minLength) ? 0 : sub.minLength,
                maxLength: isNaN(sub.maxLength) ? MAX_INPUT_NUM : sub.maxLength,
                placeholder: property.placeholder || ""
            }
        );
    }

    getFormEditorConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicEditorModelConfig {
        const sub = property.type == "array" ? property.items || property : property;
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                inputType: property.format || "json",
                convertObject: property.type !== "string",
                autoComplete: property.autoComplete || "off",
                multiple: property.type == "array",
                accept: ObjectUtils.isString(property.accept) ? property.accept : null,
                mask: ObjectUtils.isString(property.mask) ? property.mask : null,
                pattern: ObjectUtils.isString(property.pattern) ? property.pattern : null,
                step: isNaN(sub.step) ? (isNaN(property.step) ? 1 : property.step) : sub.step,
                minLength: isNaN(sub.minLength) ? 0 : sub.minLength,
                maxLength: isNaN(sub.maxLength) ? MAX_INPUT_NUM : sub.maxLength,
                placeholder: property.placeholder || ""
            }
        );
    }

    getFormTextareaConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicTextAreaModelConfig {
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                cols: property.cols || null,
                rows: property.rows || 10,
                wrap: property.wrap || false,
                autoComplete: property.autoComplete || "off",
                multiple: property.type == "array",
                minLength: isNaN(property.minLength) ? 0 : property.minLength,
                maxLength: isNaN(property.maxLength) ? MAX_INPUT_NUM : property.maxLength,
                placeholder: property.placeholder || ""
            }
        );
    }

    getFormDatepickerConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicDatePickerModelConfig {
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                format: property.dateFormat || "dd.MM.yyyy",
                min: this.convertToDate(property.min),
                max: this.convertToDate(property.max),
            }
        );
    }

    getFormSelectOptions(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions) {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum)) {
            return new FormSelectSubject((selectModel, formControl) => {
                const selectOptions = $enum.map(value => {
                    const label = options.labelPrefix
                        ? this.language.getTranslationSync(`${options.labelPrefix}.${property.id}.${value}`)
                        : `${property.id}.${value}`;
                    return {value, label};
                });
                return this.fixSelectOptions(selectModel, formControl, selectOptions);
            });
        }
        if (isStringWithVal(property.optionsPath)) {
            return new FormSelectSubject(async (selectModel, control, root, indexes) => {
                let path = property.optionsPath as string;
                let target = control as AbstractControl;
                let model: DynamicPathable | DynamicFormModel = selectModel;
                if (path.startsWith("$root")) {
                    path = path.substring(5);
                    while (target.parent) {
                        target = target.parent;
                    }
                    model = root;
                }
                while (path.startsWith(".")) {
                    path = path.substring(1);
                    if (target.parent) {
                        target = target.parent;
                    }
                    model = (model as DynamicPathable).parent || root;
                }
                Object.keys(indexes).forEach(key => {
                    path = path.replace(key, indexes[key]);
                });
                model = this.findModelByPath(model, path.split("."));
                const modelOptions = model instanceof DynamicSelectModel
                    ? await firstValueFrom(model.options$) :
                    [];
                const value = ObjectUtils.getValue(target.value, path);
                const options = (!ObjectUtils.isArray(value) ? [] : value).map(value => {
                    const modelOption = modelOptions.find(t => t.value == value);
                    return {value, label: modelOption?.label || value};
                });
                return this.fixSelectOptions(selectModel, control, options);
            });
        }
        return new FormSelectSubject(async (selectModel, control) => {
            const entries = Object.entries((control.root as FormGroup)?.controls || {});
            const endpoint = entries.reduce((res, [key, control]) => {
                return this.replaceOptionsEndpoint(res, key, control?.value);
            }, `${property.endpoint}`);
            this.api.cache[endpoint] = this.api.cache[endpoint] || this.api.list(endpoint, this.api.makeListParams(1, -1)).then(result => {
                const items = ObjectUtils.isArray(result)
                    ? result
                    : (ObjectUtils.isArray(result.items) ? result.items : []);
                return items.map(i => {
                    const item = ObjectUtils.isObject(i) ? i : {id: i};
                    return {
                        ...item,
                        value: item.id || item._id,
                        label: item[property.labelField] || item.label || item.id || item._id
                    };
                });
            });
            const options = (await this.api.cache[endpoint]).map(t => Object.assign({}, t));
            return this.fixSelectOptions(selectModel, control, options);
        });
    }

    getFormRadioConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicRadioGroupModelConfig<any> {
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                options: this.getFormSelectOptions(property, options),
            }
        );
    }

    getFormSelectConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicSelectModelConfig<any> {
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                options: this.getFormSelectOptions(property, options),
                multiple: property.type == "array",
                groupBy: property.groupBy,
                inline: property.inline,
                allowEmpty: property.allowEmpty,
            }
        );
    }

    getFormUploadConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicFileUploadModelConfig {
        const url = this.api.url(property.url || "assets");
        const {accept, autoUpload, maxSize, minSize, removeUrl, showFileList} = property;
        return Object.assign(this.getFormControlConfig(property, options), {
            url,
            accept,
            autoUpload,
            maxSize,
            minSize,
            removeUrl,
            showFileList
        });
    }

    getFormCheckboxConfig(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicCheckboxModelConfig {
        return Object.assign(
            this.getFormControlConfig(property, options),
            {
                indeterminate: property.indeterminate || false
            }
        );
    }

    cloneFormArrayGroup(index: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel) {
        this.insertFormArrayGroup(index, formArray, formArrayModel);
        this.patchGroup(formArray.at(index + 1).value, formArrayModel.groups[index].group, formArray.at(index) as FormGroup);
        formArrayModel.filterGroups();
    }

    protected replaceOptionsEndpoint(endpoint: string, key: string, value: any): string {
        if (ObjectUtils.isObject(value)) {
            return Object.entries(value).reduce((res, [k, v]) => {
                return this.replaceOptionsEndpoint(res, `${key}.${k}`, v);
            }, endpoint)
        }
        if (ObjectUtils.isArray(value)) {
            return value.reduce((res, v, i) => {
                return this.replaceOptionsEndpoint(res, `${key}.${i}`, v);
            }, endpoint)
        }
        return endpoint.replace(new RegExp(`\\$${key}`, "gi"), `${value ?? ""}`);
    }

    protected async fixSelectOptions(model: DynamicSelectModel<any>, control: FormControl, options: DynamicFormOptionConfig<any>[]): Promise<DynamicFormOptionConfig<any>[]> {
        if (!options) return [];
        for (const option of options) {
            option.classes = [option.classes, model.getClasses(option, model, control, this.injector)].filter(isStringWithVal).join(" ");
            option.label = await this.language.getTranslation(option.label);
        }
        return options;
    }

    protected getValidators(property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions): DynamicValidatorsConfig {
        const validators: DynamicValidatorsConfig = {};
        const schema = options.schema;
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
        if (isString(property.pattern) && property.pattern.length) {
            validators.pattern = property.pattern;
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
