import {Inject, Injectable} from "@angular/core";
import {API_SERVICE, IApiService, StringUtils} from "@stemy/ngx-utils";

import {FormUtilities} from "./form-utilities";

import {
    createFormFile,
    createFormInput,
    createFormSelect,
    FormControlValidatorFactory,
    IDynamicFormControl,
    IFormControl,
    IFormControlData,
    IFormFileData,
    IFormInputData,
    IFormSelectData,
    IFormSerializers
} from "../common-types";

export interface IOpenApiSchemaProperty {
    id: string;
    type: string;
    format: string;
    column: boolean;
    additionalProperties: any;
    $ref: string;
    enum: string[];
    [key: string]: any;
}

export interface IOpenApiSchema {
    properties: { [name: string]: IOpenApiSchemaProperty };
    required: string[];
}

export interface IDynamicFormInputs {
    controls?: IFormControl[];
    serializers?: IFormSerializers;
    schema?: IOpenApiSchema;
}

@Injectable()
export class OpenApiService {

    private schemasPromise: Promise<any>;
    private schemas: any;

    constructor(@Inject(API_SERVICE) private api: IApiService) {
        const baseUrl = this.api.url("").replace("api/", "api-docs");
        this.schemas = {};
        this.schemasPromise = new Promise<any>((resolve => {
            this.api.client.get(baseUrl).subscribe((res: any) => {
                this.schemas = res.definitions || {};
                resolve(this.schemas);
            }, () => {
                resolve({});
            });
        }));
    }

    getFormInputsForSchema(name: string): Promise<IDynamicFormInputs> {
        this.api.cache = {};
        return this.schemasPromise.then(schemas => {
            const schema: IOpenApiSchema = schemas[name];
            const inputs = this.getFormInputsForSchemaDef(schema);
            return inputs;
        });
    }

    private getFormInputsForSchemaDef(schema: IOpenApiSchema): IDynamicFormInputs {
        const inputs: IDynamicFormInputs = {};
        if (!schema) return inputs;
        inputs.schema = schema;
        inputs.serializers = {};
        inputs.controls = Object.keys(schema.properties || {}).map(p => {
            const property = schema.properties[p];
            property.id = p;
            inputs.serializers[p] = (id: string, parent: IDynamicFormControl) => {
                return Promise.resolve(parent.model[id]);
            };
            return this.getFormControlForProperty(property, schema);
        }).filter(t => null !== t);
        return inputs;
    }

    private getFormControlForProperty(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): IFormControl {
        if (Array.isArray(property.enum)) {
            return createFormSelect(property.id, this.getFormSelectData(property, schema));
        }
        switch (property.type) {
            case "string":
            case "number":
            case "boolean":
            case "textarea":
                return createFormInput(property.id, this.getFormInputData(property, schema));
            case "list":
                return createFormSelect(property.id, this.getFormSelectData(property, schema));
            case "file":
                return createFormFile(property.id, this.getFormFileData(property, schema));
        }
        return null;
    }

    private getBaseFormData(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): IFormControlData {
        return {
            readonly: property.readonly ? FormUtilities.readonly : null,
            shouldSerialize: FormUtilities.checkReadonly,
            validators: this.getValidators(property, schema)
        }
    }

    private getFormInputData(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): IFormInputData {
        let type = StringUtils.has(property.id, "password", "Password") ? "password" : property.type;
        switch (property.type) {
            case "boolean":
                type = "checkbox";
                break;
            case "textarea":
                type = "textarea";
                break;
        }
        return {
            ...this.getBaseFormData(property, schema),
            type
        };
    }

    private getFormSelectData(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): IFormSelectData {
        const options = Array.isArray(property.enum)
            ? () => {
                return Promise.resolve(property.enum.map(id => ({ id, label: `${property.id}.${id}` })));
            }
            : () => {
                this.api.cache[property.endpoint] = this.api.cache[property.endpoint] || this.api.list(property.endpoint, this.api.makeListParams(1, -1)).then(result => {
                    return result.items.map(i => {
                        return { id: i._id, label: i.name };
                    });
                });
                return this.api.cache[property.endpoint];
            };
        return {
            ...this.getBaseFormData(property, schema),
            options,
        };
    }

    private getFormFileData(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): IFormFileData {
        return {
            ...this.getBaseFormData(property, schema),
            multi: property.multi
        };
    }

    private getValidators(property: IOpenApiSchemaProperty, schema: IOpenApiSchema): FormControlValidatorFactory[] {
        const validators: FormControlValidatorFactory[] = [];
        if (schema.required.indexOf(property.id) >= 0) {
            validators.push(FormUtilities.validateRequired);
        }
        if (property.minLength) {
            validators.push({
                type: FormUtilities,
                func: FormUtilities.validateMinLength,
                params: [property.minLength]
            });
        }
        if (property.maxLength) {
            validators.push({
                type: FormUtilities,
                func: FormUtilities.validateMaxLength,
                params: [property.maxLength]
            });
        }
        switch (property.format) {
            case "email":
                validators.push(FormUtilities.validateEmail);
                break;
        }
        return validators;
    }
}
