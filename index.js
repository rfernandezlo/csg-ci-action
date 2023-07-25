const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

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

async function changeLabels(ownership,pr){
    try {
        await octokit.rest.issues.addLabels({
            ...ownership,
            issue_number: pr,
            labels: ['validated'],
        });
        await octokit.rest.issues.removeLabel({
            ...ownership,
            issue_number: pr,
            name: 'validate'
        });
    } catch (e) {
        core.warning(`failed removing/adding labels: ${e}`);
    }
    return sha;
}
  

async function splitStr(str, separator) {
    
    return str.split(separator)
}

const main = async () => {
    try {

        let sourcebranch = core.getInput('source_branch');
        let branch = await splitStr(sourcebranch,'/');
 
        core.debug(`branch split ${branch}`);

        let filename = core.getInput('file_name');
        const pathFile = `manifest/${branch[1]}/${filename}`;
        core.debug(`Path File inputs ${pathFile}`);

        if (await checkFileExists(pathFile)){
            core.setOutput('file_path',  pathFile);
        }

        // --pre-destructive-changes    destructiveChangesPre.xml
        // --post-destructive-changes   destructiveChangesPost.xml

        core.debug(`Parsing inputs`);
        const r_status  = core.getInput('status', {required: false});
        const r_token   = await getSHA(core.getInput('token', { required: true }));
        const r_name    = core.getInput('name', {required: false});
        const r_pr      = core.getInput('pull_request', {required: false});
        const r_conclusion = core.getInput('conclusion', {required: false});
        const r_title = core.getInput('output-title', {required: false});
        const r_summary = core.getInput('output-summary', {required: false});
        const octokit   = new github.getOctokit(r_token);

        core.debug(`Creating a new Run on ${r_status}/${r_name}@${r_token}`);
        const ownership = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
        };
        core.debug(`ownership  ${r_status}`);
        const sha = await getSHA();
        core.debug(`Getting sha @${sha}`);
        const result = await octokit.rest.checks.create({
            ...ownership,
            name: r_name,
            head_sha: sha,
            status: r_status,
            conclusion: r_conclusion,
            started_at: new Date().toISOString(),
            output: {
                title: r_title,
                summary: r_summary,
                text: '',
            },
        });
        await changeLabels(ownership,r_pr);
        core.debug(`Completed. Result ${result?.id}`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

main();