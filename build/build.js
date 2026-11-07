const fs = require("fs");
const path = require("path");
const cp = require("child_process");


const BUILD_OPTIONS = [
    "FIREFOX"
];
const DIST_DIR = "dist";
const CORE_DIST = "core";
const FIREFOX_DIR = "firefox";

function copyJsFiles(sourceDir, destinationFile, extra) {
    const destinationDir = path.dirname(destinationFile);
    const destinationFileName = path.basename(destinationFile);
    fs.mkdirSync(destinationDir, { recursive: true });
    const destinationPath = path.join(destinationDir, destinationFileName);

    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
        const sourcePath = path.join(sourceDir, entry.name);

        if (entry.isDirectory()) {
            copyJsFiles(sourcePath, destinationPath);
            continue;
        }

        if (entry.isFile() && path.extname(entry.name) === ".js") {
            if (fs.existsSync(destinationPath)) {
                const content = fs.readFileSync(sourcePath, 'utf8');
                fs.appendFile(destinationPath, content + '\n', 'utf8', (err) => {
                    if (err) throw err;
                    log({msg: 'The "data to append" was appended to file!', level: "DEBUG"});
                });
            } else {
                fs.copyFileSync(sourcePath, destinationPath);
            }
        }
    }
    if (extra) {
        fs.appendFile(destinationPath, extra + '\n', 'utf8', (err) => {
            if (err) throw err;
            log({msg: 'The "data to append" was appended to file!', level: "DEBUG"});
        });
    }
}

function copyHtmlFiles(sourceDir, destinationFile) {
    const destinationDir = path.dirname(destinationFile);
    const destinationFileName = path.basename(destinationFile);
    fs.mkdirSync(destinationDir, { recursive: true });

    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
        const sourcePath = path.join(sourceDir, entry.name);
        const destinationPath = path.join(destinationDir, destinationFileName);

        if (entry.isDirectory()) {
            copyHtmlFiles(sourcePath, destinationPath);
            continue;
        }

        if (entry.isFile() && path.extname(entry.name) === ".html") {
            fs.copyFileSync(sourcePath, destinationPath);
        }
    }
}

function copyCSSFiles(sourceDir, destinationFile) {
    const destinationDir = path.dirname(destinationFile);
    const destinationFileName = path.basename(destinationFile);
    fs.mkdirSync(destinationDir, { recursive: true });

    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
        const sourcePath = path.join(sourceDir, entry.name);
        const destinationPath = path.join(destinationDir, destinationFileName);

        if (entry.isDirectory()) {
            copyCSSFiles(sourcePath, destinationPath);
            continue;
        }

        if (entry.isFile() && path.extname(entry.name) === ".css") {
            fs.copyFileSync(sourcePath, destinationPath);
        }
    }
}

function clean() {
    const current = process.cwd();
    const distDir = path.resolve(current, DIST_DIR);
    fs.rmSync(distDir, { recursive: true, force: true });
}

function logMsg(msg) {
    if (Array.isArray(msg)) console.log(...msg);
    else console.log(msg);
}

function log(msg = {msg: undefined, level: 'INFO'}) {
    if (!msg.level) msg.level = 'INFO';
    
    switch (msg.level) {
        case 'INFO':
            logMsg(msg.msg);
            break;
        case 'DEBUG':
            if (options.debug) {
                logMsg(msg.msg);
            }
           break;
        default:
            logMsg(msg.msg);
            break;
    }
}

function buildFireFox() {
    const current = process.cwd();
    const distDir = path.resolve(current, DIST_DIR, "firefox");
    const coreSourceDir = path.resolve(current, CORE_DIST, "src");
    const firefoxSourceDir = path.resolve(current, FIREFOX_DIR, "src");
    
    copyJsFiles(coreSourceDir, path.resolve(distDir, "popup.js"));
    copyJsFiles(coreSourceDir, path.resolve(distDir, "background.js"));
    copyJsFiles(firefoxSourceDir, path.resolve(distDir, "popup.js"), "Popup.initialize();");
    copyJsFiles(firefoxSourceDir, path.resolve(distDir, "background.js"));
    copyHtmlFiles(firefoxSourceDir, path.resolve(distDir, "popup.html"));
    copyCSSFiles(firefoxSourceDir, path.resolve(distDir, "popup.css"));
    fs.copyFileSync(path.resolve(path.dirname(firefoxSourceDir), "manifest.json"), path.resolve(distDir, "manifest.json"));
}

function processArgs(args = []) {
    const options = {
        clean: false,
        debug: false
    };

    args.forEach(arg => {
        if (BUILD_OPTIONS.includes(arg.toUpperCase())) {
            if (arg.toUpperCase() === "FIREFOX") options.type = "firefox";
            return;
        }
        if (arg === "clean") options.clean = true;
        if (arg === "debug") options.debug = true;
    });

    return options;
}

function build(options, type) {
    if (!type) {
        if (Array.isArray(options.type)) {
            options.type.forEach(t => build(options, t));
        } else {
            build(options, options.type);
        }
    } else {
        if (options.clean) {
            clean();
        }
        if (type === "firefox") {
            buildFireFox();
        }
    }
    
}

/**
 * Process
 */

const prog = process.argv[0];
const buildScript = process.argv[1];
const args = [];

for (let i = 2; i < process.argv.length; i++) {
    args.push(process.argv[i]);
}

const options = processArgs(args);

log({msg: options, level: "DEBUG"});
if (!Object.hasOwn(options, "type")) {
    throw "No output type defined. Options: " + BUILD_OPTIONS
}

build(options);
log({msg: "Done!"});