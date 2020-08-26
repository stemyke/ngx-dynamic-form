import {Component, Inject} from "@angular/core";
import {FormControlComponent, IDynamicFormControl, IFormFileData} from "../../common-types";
import {ApiService, ArrayUtils, FileUtils, IToasterService, ObjectUtils, TOASTER_SERVICE} from "@stemy/ngx-utils";

@Component({
    selector: "dynamic-form-file",
    styleUrls: ["./dynamic-form-file.component.scss"],
    templateUrl: "./dynamic-form-file.component.html"
})
export class DynamicFormFileComponent extends FormControlComponent<IFormFileData> {

    private fileImageCache: any[];

    // Acceptor for provider
    static acceptor(control: IDynamicFormControl): boolean {
        return control.type == "file";
    }

    // Loader for provider
    static loader(): Promise<any> {
        return Promise.resolve();
    }

    constructor(readonly api: ApiService, @Inject(TOASTER_SERVICE) readonly toaster: IToasterService) {
        super();
        this.fileImageCache = [];
    }

    onSelect(input: HTMLInputElement): void {
        this.processFiles(input.files);
        input.value = "";
    }

    protected processFiles(fileList: FileList): void {
        const files: File[] = [];
        const accept = this.data.accept;
        const types: string[] = ObjectUtils.isString(accept) && accept.length > 0 ? accept.toLowerCase().split(",") : null;
        if (fileList.length == 0) return;
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList.item(i);
            const type = file.type.toLowerCase();
            const ext = FileUtils.getExtension(file);
            if (types && !ArrayUtils.has(types, type, ext)) continue;
            files.push(file);
        }
        if (files.length == 0) {
            this.toaster.error("message.error.wrong-files");
            return;
        }
        this.upload(files);
    }

    protected upload(files: File[]): void {
        const single = !this.data.multi;
        if (single) files.length = Math.min(files.length , 1);
        const promises = [];
        files.forEach((file, ix) => {
            if (this.data.asDataUrl) {
                promises.push(FileUtils.readFileAsDataURL(file));
                return;
            }
            if (this.data.asFile) {
                promises.push(Promise.resolve(file));
                return;
            }
            promises.push(
                this.api.upload(
                    this.data.uploadUrl,
                    this.data.createUploadData(file),
                    console.log,
                    this.data.uploadOptions
                ).then(asset => asset._id || asset, () => null)
            );
        });
        Promise.all(promises).then(assets => {
            if (single) {
                this.control.setValue(assets[0]);
                return;
            }
            const current = this.value || [];
            this.control.setValue(current.concat(assets.filter(t => !!t)));
        });
    }

    delete(index?: number): void {
        if (this.data.multi) {
            const current = Array.from(this.value || []);
            current.splice(index, 1);
            this.control.setValue(current);
            return;
        }
        this.control.setValue(null);
    }

    getUrl(image: any): string {
        return `url('${this.getImgUrl(image)}')`;
    }

    private getImgUrl(image: any): string {
        if (ObjectUtils.isBlob(image)) {
            let cache = this.fileImageCache.find(t => t.file == image);
            if (!cache) {
                cache = {file: image, url: URL.createObjectURL(image)};
                this.fileImageCache.push(cache);
            }
            return cache.url;
        }
        const url = !image ? null : image.imageUrl || image;
        if (!ObjectUtils.isString(url)) return null;
        if (url.startsWith("data:")) return url;
        if (!this.data.baseUrl) {
            const subUrl = url.startsWith("/") ? url.substr(1) : url;
            return this.api.url(subUrl);
        }
        return this.api.url(`${this.data.baseUrl}${url}`);
    }
}
