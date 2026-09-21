/**
 * Feature switches for capabilities that depend on external setup.
 * Flip appleSignIn on once the app has the Sign in with Apple entitlement
 * (paid Apple Developer account) and the Apple provider is enabled in Firebase.
 */
export const features = {
  appleSignIn: true,
  /**
   * Profile photos in Firebase Storage. Needs the pay-as-you-go plan. Until
   * then a small JPEG is kept inline on the profile document instead.
   */
  cloudStorage: true,
};
