/***************************************************************************************************
 * BROWSER POLYFILLS
 */

import "core-js";
//
// /** IE10 and IE11 requires the following for NgClass support on SVG elements */
// import "classlist.js";

/** IE10 and IE11 requires the following to support `@angular/animation`. */
/** ALL Firefox browsers require the following to support `@angular/animation`. **/
// import "web-animations-js";


/** Zone JS is required by Angular itself. **/

import "zone.js/dist/zone";  // Included with Angular CLI.


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

(window as any).global = window;
