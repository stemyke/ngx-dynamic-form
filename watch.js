const path = require('path');
const fs = require('fs');
const program = require('commander');
const watch = require('node-watch');
const rimraf = require('rimraf');
const copy = require('./build/copy');
const {runCommand} = require("./build/run-command");

program
    .version('13.x', '-v, --version')
    .option('-p, --project [path]', 'Project path where ngx-dynamic-form is used')
    .option('-b, --skip-build', 'Skip first build')
    .option('-m, --skip-modules', 'Skip copying node modules to project')
    .parse(process.argv);

const projectPath = typeof program.project !== 'string' ? null : path.resolve(program.project);
const noProject = !projectPath;

let builds = 0;

function deployToProject() {
    if (noProject) return Promise.resolve();
    const stemyPath = path.join(projectPath, 'node_modules', '@stemy');
    return copy('./dist/', stemyPath, 'dist folder to project').then(() => {
        const targetPath = path.join(stemyPath, 'ngx-dynamic-form');
        if (fs.existsSync(targetPath)) {
            rimraf.sync(targetPath);
        }
        fs.renameSync(path.join(stemyPath, 'dist'), targetPath);
    });
}

function build(type, cb = null) {
    if (!type && (noProject || program.skipBuild)) {
        cb();
        return;
    }
    console.log('Build started:', type || 'All');
    builds++;
    runCommand(`node build/build.js ${type}`).then(() => {
        console.log('Build ended:', type || 'All');
        return null;
    }, reason => {
        console.error(reason);
        return null;
    }).then(() => {
        builds--;
        if (builds === 0) {
            console.log("All builds are finished");
            const deploy = noProject || !type ? Promise.resolve() : deployToProject();
            deploy.then(() => {
                if (typeof cb !== 'function') return;
                cb();
            });
        }
    });
}

build('', () => {
    console.log('Watching for file changes started.');
    watch('./src', { delay: 1000, recursive: true, filter: /\.(json|html|scss|ts)$/ }, () => build('ngx-dynamic-form'));
    if (noProject || program.skipModules) {
        deployToProject();
        return;
    }
    copy('./node_modules', path.join(projectPath, 'node_modules'), `node modules to project: ${projectPath}`).then(() => {
        deployToProject();
    });
});
