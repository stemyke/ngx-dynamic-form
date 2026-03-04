import {Component, Inject, OnDestroy, OnInit, ViewEncapsulation} from "@angular/core";
import {Subscription} from "rxjs";
import {EventsService, ILanguageService, ITranslation, LANGUAGE_SERVICE} from "@stemy/ngx-utils";
import {FormFieldConfig} from "../../common-types";
import {DynamicFormArrayComponent} from "../dynamic-form-array/dynamic-form-array.component";

@Component({
    standalone: false,
    selector: "dynamic-form-translation",
    templateUrl: "./dynamic-form-translation.component.html",
    styleUrls: ["./dynamic-form-translation.component.scss"],
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormTranslationComponent extends DynamicFormArrayComponent implements OnInit, OnDestroy {

    protected subscription: Subscription;

    constructor(readonly events: EventsService,
                @Inject(LANGUAGE_SERVICE) readonly language: ILanguageService) {
        super();
    }

    ngOnInit() {
        this.subscription = this.events.editLanguageChanged.subscribe(lang => this.setLanguage(lang));
        this.setLanguage(this.language.editLanguage);
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    protected setLanguage(lang: string): void {
        if (!this.formControl) return;
        const value: ITranslation[] = this.formControl.value || [];
        const index = value.findIndex(i => i.lang === lang);
        if (index < 0) {
            this.addItem(value.length, {
                lang, translation: ""
            });
            return;
        }
        this.currentTab.set(index);
    }
}
