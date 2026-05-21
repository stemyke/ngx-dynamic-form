import {join, resolve} from 'path';
import {deleteSync} from 'del';
import cpy from 'cpy';
import {existsSync, renameSync} from 'fs';
import {program} from 'commander';
import {ngPackagr} from 'ng-packagr';

const moduleNamespace = '@stemy';
const moduleName = 'ngx-dynamic-form';
program
    .version('19.9.0', '-v, --version')
    .option('-p, --project [path]', `Project path where '${moduleName}' is used`)
    .parse(process.argv);

const options = program.opts();
const projectPath = typeof options.project !== 'string' ? null : resolve(options.project);
const noProject = !projectPath;

/**
 * @type {AbortController}
 */
let deploy = null;

function deployToProject() {
    if (deploy) {
        deploy.abort();
    }
    if (noProject) return;
    deploy = new AbortController();
    const nsPath = join(projectPath, 'node_modules', moduleNamespace);
    const distPath = join(nsPath, 'dist');
    let canceled = false;
    cpy('./dist/**', distPath, {flat: false, filter: () => !canceled})
        .catch(error => {
            console.warn(`Error occurred while copying`, error);
        })
        .then(() => {
            if (canceled) return;
            const targetPath = join(nsPath, moduleName);
            if (existsSync(targetPath)) {
                deleteSync(targetPath, {force: true});
            }
            renameSync(distPath, targetPath);
            console.log(`Copy finished to project`, projectPath);
        });
    deploy.signal.addEventListener('abort', () => {
        canceled = true;
    });
}

ngPackagr()
    .forProject('ng-package.json')
    .withTsConfig('tsconfig.json')
    .watch()
    .subscribe(deployToProject)
