import UIKit
import Firebase

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // The window lives on SceneDelegate. React Native Firebase Messaging still
  // sends `window` to the app delegate at launch and crashes with an
  // unrecognized selector if the property is missing, so declare it (nil).
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()
    return true
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    return UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
  }
}
