import {ComponentFactoryResolver, Inject, Injectable, Injector, ViewContainerRef} from "@angular/core";
import {FORM_CONTROL_PROVIDER, IDynamicFormControl, IFormControlComponent, IFormControlProvider} from "../common-types";
import {ObjectUtils} from "@stemy/ngx-utils";

@Injectable()
export class DynamicFormService {

    constructor(@Inject(FORM_CONTROL_PROVIDER) private components: IFormControlProvider[], private resolver: ComponentFactoryResolver, public readonly injector: Injector) {
    }

    findProvider(control: IDynamicFormControl): IFormControlProvider {
        if (!control) return null;
        const providers = this.components.filter(p => p.acceptor(control));
        if (providers.length == 0) {
            throw new Error(`No component provider for control: ${JSON.stringify(control)}`);
        }
        // Sort providers
        providers.sort((a, b) => ObjectUtils.compare(a.priority, b.priority))
        return providers[0];
    }

    createComponent(vcr: ViewContainerRef, provider: IFormControlProvider): IFormControlComponent {
        vcr.clear();
        if (!provider) return null;
        const factory = this.resolver.resolveComponentFactory(provider.component);
        return vcr.createComponent(factory).instance;
    }
}
