const core = require ('@actions/core');
const fs = require ('fs');

async function checkFileExists(filePath) {
    return fs.promises.access(filePath)
    .then(() => {
        core.info(`File ${filePath} exists`);
        return true;
    })
    .catch(() => {
        core.setFailed(`File ${filePath} is mandatory`);
        return false;
    });
}

const main = async () => {
    try {

        let filename = core.getInput('file_name', { required: true });
        let sourcebranch = core.getInput('source_branch', { required: false });
        const pathFile = `manifest/${sourcebranch}/${filename}`;
        core.debug(`Path File inputs ${pathFile}`);
        const result = labels.addCheck
        if (await checkFileExists(pathFile)){
            core.setOutput('file_path',  pathFile);
        }else {
            core.setFailed('failure');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

main();
