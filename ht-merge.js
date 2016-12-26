#!/usr/bin/env node

var chalk    = require('chalk');
var spawn    = require('child_process').spawnSync;
var inquirer = require('inquirer');
var request  = require('request');
var fs       = require('fs');

const QA_LIST = JSON.parse(fs.readFileSync(__dirname + '/qa.json', 'utf8')),
      CONFIG  = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));

const gitBranch = 'test1';

shellCommand('git', ['checkout', gitBranch]);
shellCommand('git', ['pull', '--rebase']);
shellCommand('git', ['checkout', /*'master'*/ 'test2']);
shellCommand('git', ['pull', '--rebase']);
shellCommand('git', ['merge', gitBranch]);

inquirer.prompt([
    {
        type: 'list',
        message: 'Was the merge successful?',
        name: 'merge',
        choices: [
            'Yes',
            'No'
        ]
    }
]).then(function(answers) {
    if (answers.merge === 'Yes') {
         shellCommand('git', ['add', '.']);
         shellCommand('git', ['commit', '--no-edit']);
         shellCommand('git', ['push', 'origin', '--delete', gitBranch]);
         shellCommand('git', ['branch', '-d', gitBranch]);

        inquirer.prompt([
            {
                type: 'checkbox',
                message: 'Hipchat Message',
                name: 'hipchatUsers',
                choices: QA_LIST
            }
        ]).then(function(answers) {
            answers.hipchatUsers.forEach(function(hipchatUser) {
                request.post({
                    url: `https://api.hipchat.com/v2/user/${hipchatUser}/message?auth_token=${CONFIG.hipchat.authToken}`,
                    form: {
                        message_format: 'text',
                        message: 'Testing hipchat curl request"'
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }, function (error, response, body) {
                    // console.log(error, response, body);
                });
            });
        });
    }
});

function shellCommand(command, args) {
    console.log(chalk.cyan.bold(command + ' ' + args.join(' ')));

    let cmd = spawn(command, args);
    console.log(cmd.stdout.toString(), cmd.stderr.toString());
}