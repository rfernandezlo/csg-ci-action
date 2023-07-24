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

async function checkFileStartsWithHeader(filePath) {
    return fs.promises.readFile(filePath, 'utf8')
    .then(fileContent => {

        // remove all empty lines ad the beginning of the file
        fileContent = fileContent.replace(/^\s*\n/gm, '');

        if (fileContent.startsWith('#')) {
            core.info(`File ${filePath} starts with a header`);
            return true;
        } else {
            core.setFailed(`File ${filePath} does not start with a header`);
            return false;
        }
    });
}

const main =   async () => {
        try {
            core.debug(`Parsing inputs`);
            const r_status = core.getInput('status');
            const r_token = core.getInput('repo-token', { required: true });
            const r_name = core.getInput('name');
            const r_conclusion = core.getInput('conclusion');
            const r_title = core.getInput('output-title');
            const r_summary = core.getInput('output-summary');
            const octokit = new github.getOctokit(r_token);
            core.debug(`Setting up OctoKit`);
            core.debug(`Creating a new Run on ${r_status}/${r_name}@${r_token}`);
            await octokit.rest.checks.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                name: r_name,
                head_sha: github.context.sha,
                status: r_status,
                conclusion: r_conclusion,
                output: {
                    title: r_title,
                    summary: r_summary
                }
            });
            core.debug(`Done`);
        } catch (error) {
            core.setFailed(error.message);
        }
    }

main();