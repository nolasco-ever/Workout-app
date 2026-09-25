import { createNavigationContainerRef } from '@react-navigation/native';
import type { AppStackParams } from '../appNavigators/AppStack';

/**
 * A handle on the root navigator for code that runs outside React, such as
 * a notification tap arriving before any screen has mounted.
 */
export const navigationRef = createNavigationContainerRef<AppStackParams>();
