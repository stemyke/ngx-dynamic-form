import {spawn} from 'child_process';
import {join, resolve} from 'path';
import {deleteSync} from 'del';
import {existsSync, renameSync} from 'fs';
import {program} from 'commander';
import watch from 'node-watch';
import {copy} from './build/copy.mjs';

program
    .version('19.0.1', '-v, --version')
    .option('-b, --skip-build', 'Skip first build')
    .option('-m, --modules', 'Also copy node modules to project')
    .option('-p, --project [path]', 'Project path where "ngx-dynamic-form" is used')
    .parse(process.argv);

const options = program.opts();
const projectPath = typeof options.project !== 'string' ? null : resolve(options.project);
const noProject = !projectPath;

let child = null;
let deploy = null;

function deployToProject() {
    if (noProject) return;
    const stemyPath = join(projectPath, 'node_modules', '@stemy');
    const distPath = join(stemyPath, 'dist');
    deploy = copy('./dist/**', distPath, 'dist folder to project');
    return deploy.then(() => {
        const targetPath = join(stemyPath, 'ngx-dynamic-form');
        if (existsSync(targetPath)) {
            deleteSync(targetPath, {force: true});
        }
        renameSync(distPath, targetPath);
    });
}

function build(cb = new Function("void 0")) {
    if (child) {
        child.kill();
    }
    if (deploy) {
        deploy.cancel();
    }
    if (options.skipBuild) {
        cb();
        return;
    }
    console.log('Build started...');
    child = spawn('node', ['build/build.mjs']);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('exit', () => {
        console.log('Build ended');
        deployToProject().then(() => {
            if (typeof cb !== 'function') return;
            cb();
        });
    });
}

build(async () => {
    console.log('Watching for file changes started.');
    watch('./src', {delay: 1000, recursive: true, filter: /\.(json|html|scss|ts)$/}, () => build());
    if (!options.modules) return;
    await copy('./node_modules/**', join(projectPath, 'node_modules'), `node modules to project: ${projectPath}`);
});
