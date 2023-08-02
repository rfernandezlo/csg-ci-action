const core = require ('@actions/core');
const github = require ('@actions/github');
const fs = require ('fs');
const labels = require ('./labels.js')

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

async function getSHA(inputSHA){
    let sha = github.context.sha;
    core.debug(`sha @${sha}`);
    if (github.context.eventName == 'pull_request') {
      const pull = github.context.payload.pull_request;
      if (pull?.head.sha) {
        sha = pull?.head.sha;
      }
    }
    if (inputSHA) {
      sha = inputSHA;
    }
    core.debug(`return sha @${sha}`);
    return sha;
}

async function createCheck(octokit,ownership,r_name,r_status,r_conclusion,r_title,r_summary){
    
    const {
        data: { id }
    } = await octokit.rest.checks.create({
        ...ownership,
        name: r_name,
        head_sha: token,
        status: r_status,
        conclusion: r_conclusion,
        started_at: new Date().toISOString(),
        output: {
            title: r_title,
            summary: r_summary,
            text: '',
        },
    });
    return id;
}

const main = async () => {
    try {

        let filename = core.getInput('file_name', { required: true });
        const r_token = await getSHA(core.getInput('token', { required: true }));
        const octokit = new github.getOctokit(r_token);
        const ownership = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
        };
        let sourcebranch = core.getInput('source_branch', { required: false });
        const pathFile = `manifest/${sourcebranch}/${filename}`;
        core.debug(`Path File inputs ${pathFile}`);
        
        const result = labels.addCheck
        if (await checkFileExists(pathFile)){
            core.setOutput('file_path',  pathFile);
            createCheck(octokit,ownership,r_name,r_status,r_conclusion,r_title,r_summary);
        }
        core.debug(`Completed. Result ${result?.id}`);
        
    } catch (error) {
        core.setFailed(error.message);
    }
}

main();
