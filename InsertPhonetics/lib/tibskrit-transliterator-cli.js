const fs = require('fs');
const vm = require('vm');
const path = require('path');

const sugarPath = path.join(__dirname, 'tibskrit-transliterator-app', 'vendor', 'javascripts', 'sugar.js');
const underscorePath = path.join(__dirname, 'tibskrit-transliterator-app', 'vendor', 'javascripts', 'underscore.min.js');
const normalizerPath = path.join(__dirname, 'tibskrit-transliterator-app', 'vendor', 'javascripts', 'tibetan-normalizer.umd.js');
const libPath = path.join(__dirname, 'tibskrit-transliterator-app', 'javascripts', 'tibkrit-transliterator.js');
const utilsPath = path.join(__dirname, 'tibskrit-transliterator-app', 'javascripts', 'utils.js');
const sugarCode = fs.readFileSync(sugarPath, 'utf-8');
const underscoreCode = fs.readFileSync(underscorePath, 'utf-8');
const normalizerCode = fs.readFileSync(normalizerPath, 'utf-8');
const libCode = fs.readFileSync(libPath, 'utf-8');
const utilsCode = fs.readFileSync(utilsPath, 'utf-8');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(sugarCode, sandbox);
vm.runInContext(underscoreCode, sandbox);
vm.runInContext(normalizerCode, sandbox);
vm.runInContext(utilsCode, sandbox);
vm.runInContext(libCode, sandbox);

const filePath = process.argv[2];
const isPhonetics = process.argv[3] == "true";

let input;
try {
    input = fs.readFileSync(filePath, 'utf-8');
} catch (error) {
    console.error("Failed to read the file:", error.message);
    process.exit(1);
}

const TibkritTransliterator = sandbox.TibkritTransliterator;
const output = new TibkritTransliterator(input).transliterate({ capitalize: true, phonetics: isPhonetics });

console.log(output);
