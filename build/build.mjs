import {ngPackagr} from "ng-packagr";
import {copy} from "./copy.mjs";

ngPackagr()
    .forProject('ng-package.json')
    .withTsConfig('tsconfig.json')
    .build()
    .then(() => copy('./dist/assets/**', './dist', 'assets'))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
