const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function getSubdirectories (directoryPath) {
	return fs.readdirSync(directoryPath, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);
}

function isGitRepository (directoryPath) {
	const gitFolderPath = path.join(directoryPath, '.git');
	return fs.existsSync(gitFolderPath) && fs.statSync(gitFolderPath).isDirectory();
}

function doesReleaseBranchExist (directoryPath) {
	try {
		const branches = execSync('git branch -r', { cwd: directoryPath, encoding: 'utf-8' });
		return branches.includes('origin/release');
	} catch (error) {
		return false;
	}
}

function getCommitsInRange (directoryPath, range) {
	const command = `git log --pretty=format:"%s" --abbrev-commit ${range}`;
	try {
		const result = execSync(command, { cwd: directoryPath, encoding: 'utf-8' });
		return result.trim().split('\n');
	} catch (error) {
		return [];
	}
}

function getCommitCountBehind (directoryPath) {
	if (doesReleaseBranchExist(directoryPath)) {
		execSync('git fetch origin release', { cwd: directoryPath, encoding: 'utf-8' });

		const command = 'origin/release..origin/master';
		const commitMessages = getCommitsInRange(directoryPath, command);
		const commitCount = commitMessages.length;

		if (commitMessages.length === 1 && commitMessages[0] === '')
			return { count: 0, messages: [] };

		return { count: commitCount, messages: commitMessages };
	}
	return { count: 0, messages: [] };
}

const greenColor = '\x1b[32m';
const grayColor = '\x1b[90m';
const resetColor = '\x1b[0m';

function displayCommitCountBehind (directoryPath) {
	if (isGitRepository(directoryPath)) {
		const { count, messages } = getCommitCountBehind(directoryPath);
		if (count > 0) {
			console.log(`${greenColor}${path.basename(directoryPath)}: ${count} commit(s)`);
			messages.forEach((message, index) => {
				console.log(`${grayColor}${index + 1}. ${message}`);
			});
			console.log('\n');
		}
	}
}

function processSubdirectories (subdirectories) {
	subdirectories.forEach(subdirectory => {
		const fullPath = path.join(process.cwd(), subdirectory);
		if (isGitRepository(fullPath)) 
			displayCommitCountBehind(fullPath);
	});
}

console.log('\n');
const subdirectories = getSubdirectories(process.cwd());
processSubdirectories(subdirectories);
console.log(resetColor);
