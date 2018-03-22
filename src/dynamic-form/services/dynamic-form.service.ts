import {ComponentFactoryResolver, Inject, Injectable, Injector} from "@angular/core";
import "rxjs/Rx";
import {FORM_CONTROL_PROVIDER, IFormControlProvider} from "../dynamic-form.types";

@Injectable()
export class DynamicFormService {

    constructor(@Inject(FORM_CONTROL_PROVIDER) private components: IFormControlProvider[], private resolver: ComponentFactoryResolver, private injector: Injector) {
        console.log(components);
        const factory = this.resolver.resolveComponentFactory(components[0].component);
        console.log(factory.create(injector));
    }
}
