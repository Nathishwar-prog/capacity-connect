declare module 'mammoth' {
  export interface Result {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface Options {
    styleMap?: string | string[];
    includeDefaultStyleMap?: boolean;
    convertImage?: any;
    ignoreEmptyParagraphs?: boolean;
  }

  export function convertToHtml(
    input: { path?: string; buffer?: Buffer },
    options?: Options
  ): Promise<Result>;

  export function extractRawText(
    input: { path?: string; buffer?: Buffer }
  ): Promise<Result>;
}
