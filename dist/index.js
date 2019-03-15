import typescript from 'rollup-plugin-typescript';
import { rollup } from 'rollup';
import stylis from 'stylis';
import * as requireFromString from 'require-from-string';
import { requireFromString as requireFromString$1 } from 'require-from-string';
import validator from 'csstree-validator';
import cssBeautify from 'cssbeautify';
import chalk from 'chalk';

function loadDiagnostic(context, sassError, filePath) {
    if (!sassError || !context) {
        return;
    }
    const diagnostic = {
        level: 'error',
        type: 'css',
        language: 'scss',
        header: 'sass error',
        code: sassError.status && sassError.status.toString(),
        relFilePath: null,
        absFilePath: null,
        messageText: sassError.message,
        lines: []
    };
    if (filePath) {
        diagnostic.absFilePath = filePath;
        diagnostic.relFilePath = formatFileName(context.config.rootDir, diagnostic.absFilePath);
        diagnostic.header = formatHeader('sass', diagnostic.absFilePath, context.config.rootDir, sassError.line);
        if (sassError.line > -1) {
            try {
                const sourceText = context.fs.readFileSync(diagnostic.absFilePath);
                const srcLines = sourceText.split(/(\r?\n)/);
                const errorLine = {
                    lineIndex: sassError.line - 1,
                    lineNumber: sassError.line,
                    text: srcLines[sassError.line - 1],
                    errorCharStart: sassError.column,
                    errorLength: 0
                };
                for (let i = errorLine.errorCharStart; i >= 0; i--) {
                    if (STOP_CHARS.indexOf(errorLine.text.charAt(i)) > -1) {
                        break;
                    }
                    errorLine.errorCharStart = i;
                }
                for (let j = errorLine.errorCharStart; j <= errorLine.text.length; j++) {
                    if (STOP_CHARS.indexOf(errorLine.text.charAt(j)) > -1) {
                        break;
                    }
                    errorLine.errorLength++;
                }
                if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
                    errorLine.errorLength = 1;
                    errorLine.errorCharStart--;
                }
                diagnostic.lines.push(errorLine);
                if (errorLine.lineIndex > 0) {
                    const previousLine = {
                        lineIndex: errorLine.lineIndex - 1,
                        lineNumber: errorLine.lineNumber - 1,
                        text: srcLines[errorLine.lineIndex - 1],
                        errorCharStart: -1,
                        errorLength: -1
                    };
                    diagnostic.lines.unshift(previousLine);
                }
                if (errorLine.lineIndex + 1 < srcLines.length) {
                    const nextLine = {
                        lineIndex: errorLine.lineIndex + 1,
                        lineNumber: errorLine.lineNumber + 1,
                        text: srcLines[errorLine.lineIndex + 1],
                        errorCharStart: -1,
                        errorLength: -1
                    };
                    diagnostic.lines.push(nextLine);
                }
            }
            catch (e) {
                console.error(`StyleSassPlugin loadDiagnostic, ${e}`);
            }
        }
    }
    context.diagnostics.push(diagnostic);
}
function formatFileName(rootDir, fileName) {
    if (!rootDir || !fileName)
        return '';
    fileName = fileName.replace(rootDir, '');
    if (/\/|\\/.test(fileName.charAt(0))) {
        fileName = fileName.substr(1);
    }
    if (fileName.length > 80) {
        fileName = '...' + fileName.substr(fileName.length - 80);
    }
    return fileName;
}
function formatHeader(type, fileName, rootDir, startLineNumber = null, endLineNumber = null) {
    let header = `${type}: ${formatFileName(rootDir, fileName)}`;
    if (startLineNumber !== null && startLineNumber > 0) {
        if (endLineNumber !== null && endLineNumber > startLineNumber) {
            header += `, lines: ${startLineNumber} - ${endLineNumber}`;
        }
        else {
            header += `, line: ${startLineNumber}`;
        }
    }
    return header;
}
const STOP_CHARS = ['', '\n', '\r', '\t', ' ', ':', ';', ',', '{', '}', '.', '#', '@', '!', '[', ']', '(', ')', '&', '+', '~', '^', '*', '$'];

console.log(requireFromString);
function tss(config) {
    const usePlugin = (fileName) => /(.*\.(style|styles)\.ts)/i.test(fileName);
    const changeFileNameExt = (fileName, ext) => fileName
        .split('.')
        .map((part, i, arr) => (i === arr.length - 1 ? ext : part))
        .join('.');
    return {
        name: 'tss',
        transform(sourceText, fileName, context) {
            if (!context || !usePlugin(fileName)) {
                return null;
            }
            const results = {
                id: changeFileNameExt(fileName, 'css'),
                code: ''
            };
            if (sourceText.trim() === '') {
                return Promise.resolve(results);
            }
            return new Promise(resolve => {
                rollup({
                    input: fileName,
                    plugins: [typescript()]
                })
                    .catch(err => {
                    loadDiagnostic(context, err, fileName);
                    results.code = `/**  ts-style error${err && err.message ? ': ' + err.message : ''}  **/`;
                    resolve(results);
                })
                    .then(bundle => bundle && bundle.generate({ format: 'cjs' }))
                    .then(output => {
                    const jsFileName = changeFileNameExt(fileName, 'js');
                    const style = requireFromString$1(output.code, jsFileName);
                    results.code = stylis('', style);
                    if (config.logErrors) {
                        JSON.parse(validator.reporters.json(validator.validateString(results.code))).forEach((error) => {
                            if (!['-webkit-', '-ms-', '-moz-'].some(prefix => error.message.includes(prefix))) {
                                console.log(chalk.red('CSS-Error in file:') +
                                    fileName.substring(fileName.lastIndexOf('/')));
                                console.log(chalk.red(error.message));
                                if (error.details) {
                                    console.log('\n' + chalk.cyan('Details:'));
                                    console.log(error.details);
                                }
                                console.log('\n' + chalk.cyan('Exactly here:'));
                                console.log(`${results.code.substr(error.column - 10, 10)}${chalk.red(results.code[error.column])}${results.code.substr(error.column + 1, 10)}`);
                                console.log('\n' + chalk.cyan('Around here:'));
                                const cssBefore = results.code.substring(0, error.column);
                                const cssAfter = results.code.substring(error.column);
                                console.log(cssBeautify(results.code.substring(cssBefore.lastIndexOf('}') - 15, cssBefore.length + cssAfter.indexOf('}') + 15)));
                                console.log('\n' + '-'.repeat(35) + '\n');
                            }
                        });
                    }
                    // write this css content to memory only so it can be referenced
                    // later by other plugins (autoprefixer)
                    // but no need to actually write to disk
                    context.fs
                        .writeFile(results.id, results.code, { inMemoryOnly: true })
                        .then(() => {
                        resolve(results);
                    });
                });
            });
        }
    };
}

export { tss };
