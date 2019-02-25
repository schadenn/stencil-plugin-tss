import { loadDiagnostic } from './diagnostics';
import typescript from 'rollup-plugin-typescript';
import { rollup } from 'rollup';
import * as stylis from 'stylis';
import * as d from './declarations';

export function tss() {
  const usePlugin = (fileName: string) =>
    /(.*\.(style|styles)\.ts)/i.test(fileName);
  const createResultsId = (fileName: string) =>
    fileName
      .split('.')
      .map((part, i, arr) => (i === arr.length - 1 ? 'css' : part))
      .join('.');

  return {
    name: 'tss',
    transform(sourceText: string, fileName: string, context: d.PluginCtx) {
      if (!context || !usePlugin(fileName)) {
        return null;
      }
      const results: d.PluginTransformResults = {
        id: createResultsId(fileName),
        code: ''
      };
      if (sourceText.trim() === '') {
        return Promise.resolve(results);
      }

      return new Promise<d.PluginTransformResults>(resolve => {
        rollup
          .rollup({
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
          .then(bundle => bundle.generate({ format: 'cjs' }))
          .then(output => stylis('', eval(output.code)))
          .then(style => {
            results.code = style;

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
