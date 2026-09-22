# Releasing FlexCoach

Version numbers live in `ios/FlexCoach.xcodeproj/project.pbxproj`
(`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`) and `android/app/build.gradle`
(`versionName`, `versionCode`). Bump the build/version code on every upload.

## iOS (TestFlight)

```sh
xcodebuild archive -workspace ios/FlexCoach.xcworkspace -scheme FlexCoach \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath ~/Library/Developer/Xcode/Archives/$(date +%F)/FlexCoach-build<N>.xcarchive \
  -allowProvisioningUpdates
```

Then in Xcode: Window > Organizer > Archives > select the archive > Distribute App >
App Store Connect > Upload. Processing takes 5-15 minutes; testers get the
TestFlight invite once the build is added to a group.

One-time setup in App Store Connect (appstoreconnect.apple.com):

1. My Apps > "+" > New App: iOS, name FlexCoach, bundle id `com.flexcoach`, SKU `flexcoach`.
2. TestFlight tab > Internal Testing > create a group, add testers by Apple ID email
   (up to 100 internal testers, no review needed).
3. Test Information: contact email, and a privacy policy URL (required before
   external testing or store submission).

## Android (Play Console internal testing)

```sh
cd android && ./gradlew bundleRelease   # -> app/build/outputs/bundle/release/app-release.aab
```

Signing uses `android/keystore.properties` + `android/app/upload-keystore.jks`
(both git-ignored; back them up, losing the upload key means a Play support ticket).

One-time setup in Play Console (play.google.com/console, needs a developer account):

1. Create app: name FlexCoach, app/game, free, accept declarations.
2. Testing > Internal testing > Create release > upload the `.aab`.
   Accept Play App Signing when prompted (Google holds the final signing key;
   the local keystore is the upload key).
3. Testers tab: create an email list with the testers' Google accounts, save,
   copy the opt-in link and send it to them. Internal testing needs no review.
4. Dashboard "Set up your app" tasks (privacy policy, ads, content rating, target
   audience, data safety) are required before moving beyond internal testing.

### Google sign-in on Android release builds

Google sign-in only works for certificates registered in Firebase. In Firebase
console > Project settings > Your apps > Android, add these SHA-1 fingerprints:

- Upload key (local release builds): `8E:04:8C:CB:32:AD:4C:2C:65:AD:76:AC:04:C7:7E:46:25:92:22:29`
- Play App Signing key: Play Console > Test and release > Setup > App signing >
  "App signing key certificate" SHA-1. Builds installed from Play are signed with
  this key, so without it Google sign-in fails for testers.

After adding fingerprints, download the new `google-services.json` into
`android/app/` (git-ignored) and run `npm run sync-oauth`.

## Firebase housekeeping

- Auth users can be listed with `npx firebase auth:export users.json --format=json`.
- The app no longer uses anonymous sessions. Disable the Anonymous provider in
  Firebase Authentication > Sign-in method, and delete any leftover anonymous
  users from earlier builds.

## App icon

The master is `store/icon.svg` (1024, three plates on the accent). Everything
else derives from it and must be regenerated together when it changes:

- `ios/FlexCoach/Images.xcassets/AppIcon.appiconset/AppIcon-1024.png` (no alpha)
- `ios/FlexCoach/Images.xcassets/LaunchLogo.imageset/launch.svg` (rounded square)
- `android/app/src/main/res/drawable/ic_launcher_foreground.xml` (vector, mark
  scaled 72/1024 and offset 18 into the 108 dp adaptive canvas)
- `android/app/src/main/res/mipmap-*/ic_launcher{,_round}.png` (48 to 192 px)
- `store/play-store-icon-512.png`
- `components/brand/BrandMark.tsx` (the same geometry for the Welcome screen)

PNGs were rasterised with headless Chrome (`--screenshot`) and cropped with
`sips`; no ImageMagick or librsvg is installed on this Mac.
