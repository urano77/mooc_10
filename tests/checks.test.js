/**
 * Corrector para la práctica de sql
 */

// IMPORTS
const should = require('chai').should();
const path = require('path');
const fs = require('fs-extra');
const Utils = require('./utils');
const to = require('./to');
const Browser = require('zombie');
const child_process = require("child_process");
const spawn = require("child_process").spawn;

// CRITICAL ERRORS
let error_critical = null;

// CONSTANTS
const T_WAIT = 2; // Time between commands
const T_TEST = 2 * 60; // Time between tests (seconds)
const browser = new Browser();
const URL = "http://localhost:8000/quizzes";
const path_assignment = path.resolve(path.join(__dirname, "../"));
const path_file = path.join(path_assignment, "mooc_node-mod10_quiz_mvc_server.js");

// HELPERS
const timeout = ms => new Promise(res => setTimeout(res, ms));
let server = null;

//TESTS
describe("mooc_node-mod10_quiz_mvc_server", function () {

    this.timeout(T_TEST * 1000);

    it('', async function () { this.name = `1: Checking that the assignment file exists...`;
        this.score = 0.34;
        this.msg_ok = `Found the file '${path_file}'`;
        this.msg_err = `Couldn't find the file '${path_file}'`;
        const [error_path, path_ok] = await to(fs.pathExists(path_file));
        if (error_path) {
            error_critical = this.msg_err;
        }
        path_ok.should.be.equal(true);
    });

    it('', async function () { this.name = `2: Installing dependencies...`;
        this.score = 0.33;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = "Dependencies installed successfully";

            // check that package.json exists
            const path_json = path.join(path_assignment, 'package.json');
            const [json_nok, json_ok] = await to(fs.pathExists(path_json));
            if (json_nok || !json_ok) {
                this.msg_err = `The file '${path_json}' has not been found`;
                error_critical = this.msg_err;
                should.not.exist(error_critical);
            }
            json_ok.should.be.equal(true);

            // check package.json format
            const [error_json, content] = await to(fs.readFile(path_json, 'utf8'));
            if (error_json) {
                this.msg_err = `The file '${path_json}' doesn't have the right format`;
                error_critical = this.msg_err;
                should.not.exist(error_critical);
            }
            should.not.exist(error_json);
            const is_json = Utils.isJSON(content);
            if (!is_json) {
                this.msg_err = `The file '${path_json}' doesn't have the right format`;
                error_critical = this.msg_err;
                should.not.exist(error_critical);
            }
            is_json.should.be.equal(true);

            // run npm install
            try {
                child_process.execSync("npm install", {cwd: path_assignment}).toString();
            } catch (error_deps) {
                this.msg_err = "Error running 'npm install': " + error_deps;
                error_critical = this.msg_err;
                should.not.exist(error_critical);
            }

            // move original db file
            const path_db = path.join(path_assignment, 'db.sqlite');
            const [error, exists] = await to(fs.pathExists(path_db));
            if (exists) {
                fs.moveSync(path_db, path_db+".bak", { overwrite: true })
            }
            should.not.exist(error_critical);
        }
    });

    it('', async function () { this.name = `3: Launching the server...`;
        this.score = 0.33;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = `'${path_file}' has been launched correctly`;
            server = spawn("node", [path_file], {cwd: path_assignment});
            let error_launch = "";
            server.on('error', function (data) {
                error_launch += data
            });
            server.stderr.on('data', function (data) {
                error_launch += data
            });
            await to(timeout(T_WAIT*1000));
            this.msg_err = `Error launching '${path_file}'<<\n\t\t\tReceived: ${error_launch}`;
            if (error_launch.length) {
                error_critical = this.msg_err;
                should.not.exist(error_critical);
            }
            error_launch.should.be.equal("");
        }
    });
    it('', async function () { this.name = `4: Looking for '<table>'...`;
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const expected = "table";
            [error_nav, resp] = await to(browser.visit(URL));
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            browser.assert.elements(expected, { atLeast: 1 });
        }
    });

    it('', async function () { this.name = `4: Checking 'Edit' implementation...`;
        this.score = 3;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const expected = "Question 1";
            let error_nav = null;
            [error_nav, resp] = await to(browser.visit(URL));
            if (error_nav) {
                this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            }
            [error_nav, resp] = await to(browser.click('a[href="/quizzes/1/edit"]'));
            if (error_nav) {
                this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            }
            [error_nav, resp] = await to(browser.fill('input[name="question"]', expected));
            if (error_nav) {
                this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            }
            [error_nav, resp] = await to(browser.fill('input[name="answer"]', "Answer 1"));
            if (error_nav) {
                this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            }
            try {
                browser.assert.elements("form", { atLeast: 1 });
                browser.document.forms[0].submit();
                await to(browser.wait());
            } catch (e) {
                error_nav = e;
            }
            this.msg_ok = `Found '${expected}' in ${URL}`;
            this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            Utils.search(expected, browser.html('body')).should.be.equal(true);
        }
    });

    it('', async function () { this.name = `5: Checking 'Delete' implementation...`;
        this.score = 2;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const expected = 'a[href="/quizzes/3?_method=DELETE"]';
            [error_nav, resp] = await to(browser.visit(URL));
            [error_nav, resp] = await to(browser.click('a[href="/quizzes/3?_method=DELETE"]'));
            this.msg_ok = `Successfully deleted quiz 3 in ${URL}`;
            this.msg_err = `Could not delete quiz 3 clicking '${expected}' in ${URL}`;
            browser.querySelectorAll(expected).length.should.be.equal(0);
        }
    });

    it('', async function () { this.name = `6: Checking 'Play' implementation...`;
        this.score = 3;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const expected = /yes/i;
            let error_nav = null;
            [error_nav, resp] = await to(browser.visit(URL));
            if (error_nav) {
                this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            }
            [error_nav, resp] = await to(browser.click('a[href="/quizzes/1/play"]'));
            if (error_nav) {
                this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            }
            [error_nav, resp] = await to(browser.fill('input[name=response]', "Answer 1"));
            if (error_nav) {
                this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            }
            try {
                browser.assert.elements("form", { atLeast: 1 });
                browser.document.forms[0].submit();
                await to(browser.wait());
            } catch (e) {
                error_nav = e;
            }
            this.msg_ok = `Found '${expected}' in ${URL}`;
            this.msg_err = `Couldn't find '${expected}' in ${URL}\n\t\t\tError: >>${error_nav}<<\n\t\t\tReceived: >>${browser.html('body')}<<`;
            Utils.search(expected, browser.html('body')).should.be.equal(true);
        }
    });

    after("Closing the server", async function () {
        // kill server
        if (server) {
            server.kill();
            await to(timeout(T_WAIT*1000));
        }
        // restore original db file
        const path_db = path.join(path_assignment, 'db.sqlite');
        const [error, exists] = await to(fs.pathExists(path_db+".bak"));
        if (exists) {
            fs.moveSync(path_db+".bak", path_db, { overwrite: true })
        }
    });
});