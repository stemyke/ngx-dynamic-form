const childProcess = require("child_process");

module.exports = {
    runCommand: (scriptPath, expectedCode = 0) => {
        return new Promise((resolve, reject) => {
            const cp = childProcess.exec(scriptPath, (error, stdout, stderr) => {
                if (error && expectedCode !== error.code) {
                    console.log(error);
                    reject(error);
                    return;
                }
                const lines = (stdout || "").split("\n");
                let line = null;
                while (!line && lines.length > 0) {
                    line = lines.pop();
                }
                resolve(line);
            });
            cp.stdout.on("data", function(data) {
                console.log(data.toString());
            });
        });
    }
};
