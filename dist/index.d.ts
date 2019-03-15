import * as d from './declarations';
export declare function tss(config?: {
    logErrors: boolean;
}): {
    name: string;
    transform(sourceText: string, fileName: string, context: d.PluginCtx): Promise<d.PluginTransformResults>;
};
