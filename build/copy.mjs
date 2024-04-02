import cpy from 'cpy';
import progress from 'cli-progress';

export function copy(src, dist, what) {
    let shouldCopy = true;
    const promise = new Promise(resolve => {
        let started = false;
        const pb = new progress.Bar({}, progress.Presets.shades_classic);
        console.log(`Copying ${what}...`);
        cpy(src, dist, {flat: false, filter: () => shouldCopy}).on('progress', prg => {
            if (!started) {
                started = true;
                pb.start(prg.totalFiles, 0);
                return;
            }
            pb.update(prg.completedFiles);
        }).then(() => {
            pb.stop();
            console.log(`Copied ${what}.`);
            resolve(void 0);
        }, err => {
            console.log(`Error`, err.message);
        });
    });
    promise.cancel = () => {
        shouldCopy = false;
    };
    return promise;
}
