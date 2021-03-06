const replace = require('replace-in-file');

replace({
  files: './node_modules/@stencil/core/dist/compiler/index.js',
  from:
    "const STYLE_EXT = ['css', 'scss', 'sass', 'pcss', 'styl', 'stylus', 'less']",
  to:
    "const STYLE_EXT = ['css', 'scss', 'sass', 'pcss', 'styl', 'stylus', 'less', 'ts'];"
})
  .then(changes => {
    console.log('Modified files:', changes ? changes.join(', ') : "Was already modified :)");
    replace({
    files: './node_modules/@stencil/core/dist/compiler/index.js',
      from: "if (!styleText.includes('@import')) {",
      to: "if (!styleText.includes('import')) {"
    })
      .then(changes => {
        console.log('Modified files:', changes ? changes.join(', ') : "Was already modified :)");
        replace({
            files: './node_modules/@stencil/core/dist/compiler/index.js',
          from:
            'const IMPORT_RE = /(@import)\\s+(url\\()?\\s?(.*?)\\s?\\)?([^;]*);?/gi;',
          to:
            'const IMPORT_RE = /(@import|import).*(url\\(|from)\\s?(.*?)\\s?\\)?([^;]*);?/gi;'
        })
          .then(changes => {
            console.log('Modified files:', changes ? changes.join(', ') : "Was already modified :)");
          })
          .catch(error => {
            console.error('Error occurred:', error);
          });
      })
      .catch(error => {
        console.error('Error occurred:', error);
      });
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });
