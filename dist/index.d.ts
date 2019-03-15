import * as d from './declarations';
export declare const styled: (parts: TemplateStringsArray, ...values: any[]) => string;
export declare function tss(config?: {
    logCssErrors: boolean;
    tssFileInfix: string;
}): {
    name: string;
    transform(sourceText: string, fileName: string, context: d.PluginCtx): Promise<d.PluginTransformResults>;
};
