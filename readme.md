# stencil-plugin-css-in-ts
### Repo based on @stencil/sass

This package is used to enable using *.ts files as styleUrl for Stencil components.

First, npm install within the project:

```
npm install stencil-plugin-tss --save-dev
```

Next, within the project's `stencil.config.js` file, import the plugin and add it to the config's `plugins` config:

#### stencil.config.ts
```ts
import { Config } from '@stencil/core';
import { tss } from 'stencil-plugin-tss';

export const config: Config = {
  plugins: [
    tss({
        logCssErrors: boolean,
        tssFileInfix: string
    })
  ]
};
```

During development, this plugin will kick-in for `*tssFileInfix*.ts` style urls, and precompile them to CSS.

## Recommendations

For better hot-module-reloading currently the stencil compiler has to be modified slightly.
Run `node node_modules/stencil-plugin-tss/rewriteStencil.js` to do the needed modifications. I will open a
feature-request in the official Stencil project to make this configurable.

For better usability install styled component plugin within your IDE:
[VSCode](https://github.com/styled-components/vscode-styled-components)
[IntelliJ](https://plugins.jetbrains.com/plugin/9997-styled-components)

You can then use:
`import { styled } from "stencil-plugin-tss"`
And prefix all your template literal CSS strings with `styled` to get CSS highlighting and IntelliSense.

## Related

* [Stencil](https://stenciljs.com/)
* [Stencil Worldwide Slack](https://stencil-worldwide.slack.com)
* [Ionic Components](https://www.npmjs.com/package/@ionic/core)
* [Ionicons](http://ionicons.com/)