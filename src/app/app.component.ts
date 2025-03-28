import {Component, OnInit, ViewEncapsulation} from "@angular/core";
import {ITableColumns, UniversalService} from "@stemy/ngx-utils";

@Component({
    standalone: false,
    selector: "app-root",
    templateUrl: "./app.component.html",
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

    tableColumns: ITableColumns;
    tableData: any[];


    constructor(private universal: UniversalService) {
        this.tableColumns = {
            title: {
                title: "Title",
                filter: true,
                filterType: "enum",
                sort: "title",
                enum: ["Cím1", "Cím2", "Cím3"]
            },
            content: {
                title: "Content",
                sort: "content",
                filter: true,
            },
            fresh: {
                title: "Is fresh?",
                filter: true,
                filterType: "checkbox"
            }
        };
    }

    ngOnInit(): void {
        this.tableData = [
            {
                title: "Cím1",
                content: "Teszt",
                fresh: true,
            },
            {
                title: "Cím1",
                content: "Teszt 2",
                fresh: true,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: false,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: false,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: false,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: true,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: false,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: false,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: true,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: false,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: true,
            },
            {
                title: "Cím3",
                content: "Teszt 3",
                fresh: false,
            }
        ];
    }
}
