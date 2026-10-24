import { TranslationCoverage } from '../../core/types';

export interface IslTranslatorAdapter {
  name: string;
  translate(input: string): Promise<TranslationCoverage>;
}
