import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/** Warms the native badge model cache so a badge opens with no delay. */
export interface Spec extends TurboModule {
  /** "family:tier" keys joined by commas. */
  preload(keys: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('NativeBadgeModels');
