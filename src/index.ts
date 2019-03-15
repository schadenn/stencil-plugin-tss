import { loadDiagnostic } from './diagnostics';
import typescript from 'rollup-plugin-typescript';
import { rollup } from 'rollup';
import { default as stylis } from 'stylis';
import * as requireFromString from 'require-from-string';
import * as d from './declarations';
import validator from 'csstree-validator';
import cssBeautify from 'cssbeautify';
import chalk from 'chalk';

export function tss(config: { logErrors: boolean }) {
  const usePlugin = (fileName: string) =>
    /(.*\.(style|styles)\.ts)/i.test(fileName);
  const changeFileNameExt = (fileName: string, ext: string) =>
    fileName
      .split('.')
      .map((part, i, arr) => (i === arr.length - 1 ? ext : part))
      .join('.');

  return {
    name: 'tss',
    transform(sourceText: string, fileName: string, context: d.PluginCtx) {
      if (!context || !usePlugin(fileName)) {
        return null;
      }
      const results: d.PluginTransformResults = {
        id: changeFileNameExt(fileName, 'css'),
        code: ''
      };
      if (sourceText.trim() === '') {
        return Promise.resolve(results);
      }

      return new Promise<d.PluginTransformResults>(resolve => {
        rollup({
          input: fileName,
          plugins: [typescript()]
        })
          .catch(err => {
            loadDiagnostic(context, err, fileName);
            results.code = `/**  ts-style error${
              err && err.message ? ': ' + err.message : ''
            }  **/`;
            resolve(results);
          })
          .then(bundle => bundle && bundle.generate({ format: 'cjs' }))
          .then(output => {
            const jsFileName = changeFileNameExt(fileName, 'js');
            const style = requireFromString(
              output.code,
              jsFileName
            );
            results.code = stylis('', style);
            if (config.logErrors) {
              JSON.parse(
                validator.reporters.json(validator.validateString(results.code))
              ).forEach((error: {message: string, details: string, column: number, }) => {
                if (
                  !['-webkit-', '-ms-', '-moz-'].some(prefix =>
                    error.message.includes(prefix)
                  )
                ) {
                  console.log(
                    chalk.red('CSS-Error in file:') +
                      fileName.substring(fileName.lastIndexOf('/'))
                  );
                  console.log(chalk.red(error.message));
                  if (error.details) {
                    console.log('\n' + chalk.cyan('Details:'));
                    console.log(error.details);
                  }
                  console.log('\n' + chalk.cyan('Exactly here:'));
                  console.log(
                    `${results.code.substr(error.column - 10, 10)}${chalk.red(
                      results.code[error.column]
                    )}${results.code.substr(error.column + 1, 10)}`
                  );
                  console.log('\n' + chalk.cyan('Around here:'));
                  const cssBefore = results.code.substring(0, error.column);
                  const cssAfter = results.code.substring(error.column);
                  console.log(
                    cssBeautify(
                      results.code.substring(
                        cssBefore.lastIndexOf('}') - 15,
                        cssBefore.length + cssAfter.indexOf('}') + 15
                      )
                    )
                  );
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
