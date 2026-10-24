# Adds the FlexCoach Watch app (v1 #6) to ios/FlexCoach.xcodeproj: a watchOS SwiftUI app target embedded in the
# iPhone app, plus WatchBridge.swift in the iPhone target. Safe to run twice: it stops if the target exists.
#
#   cd ios && bundle exec ruby ../tools/ios/add-watch-target.rb
require 'xcodeproj'

project_path = File.expand_path('../../ios/FlexCoach.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)

if project.targets.any? { |t| t.name == 'FlexCoachWatch' }
  puts 'FlexCoachWatch already exists; nothing to do.'
  exit 0
end

app = project.targets.find { |t| t.name == 'FlexCoach' } or abort('No FlexCoach target')
app_settings = app.build_configurations.first.build_settings

# The iPhone app's side: WatchBridge.swift.
app_group = project.main_group.find_subpath('FlexCoach', false) or abort('No FlexCoach group')
# The group has no folder of its own: its files carry the FlexCoach/ prefix, as AppDelegate.swift does.
bridge = app_group.new_reference('FlexCoach/WatchBridge.swift')
bridge.name = 'WatchBridge.swift'
app.source_build_phase.add_file_reference(bridge)

# The Watch app.
watch = project.new_target(:application, 'FlexCoachWatch', :watchos, '10.0', nil, :swift)
watch_group = project.main_group.new_group('FlexCoachWatch', 'FlexCoachWatch')
%w[FlexCoachWatchApp.swift WatchSession.swift WatchViews.swift].each do |name|
  watch.source_build_phase.add_file_reference(watch_group.new_reference(name))
end
watch_group.new_reference('Info.plist')
watch.resources_build_phase.add_file_reference(watch_group.new_reference('Assets.xcassets'))

# The workout's state, shared with the Live Activity and the iPhone app.
shared = project.files.find { |f| f.path == 'WorkoutActivityAttributes.swift' } or abort('No WorkoutActivityAttributes.swift')
watch.source_build_phase.add_file_reference(shared)

# Sora and Manrope, as on the phone.
%w[Sora-Bold.ttf Manrope-SemiBold.ttf Manrope-Bold.ttf].each do |font|
  ref = project.files.find { |f| f.path&.end_with?(font) } or abort("No #{font}")
  watch.resources_build_phase.add_file_reference(ref)
end

watch.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.flexcoach.watchkitapp'
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['INFOPLIST_FILE'] = 'FlexCoachWatch/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['SDKROOT'] = 'watchos'
  s['WATCHOS_DEPLOYMENT_TARGET'] = '10.0'
  s['TARGETED_DEVICE_FAMILY'] = '4'
  s['SWIFT_VERSION'] = '5.0'
  s['DEVELOPMENT_TEAM'] = app_settings['DEVELOPMENT_TEAM']
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['CURRENT_PROJECT_VERSION'] = app_settings['CURRENT_PROJECT_VERSION']
  s['MARKETING_VERSION'] = app_settings['MARKETING_VERSION']
  s['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  s['SKIP_INSTALL'] = 'YES'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks']
  s['ENABLE_PREVIEWS'] = 'YES'
end

# Built with the iPhone app and carried inside it, where the Watch installs it from.
app.add_dependency(watch)
embed = app.new_copy_files_build_phase('Embed Watch Content')
embed.dst_subfolder_spec = '16'
embed.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
embed.add_file_reference(watch.product_reference).settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
# Right after the Live Activity's embed, ahead of the Firebase script phases: copied after them, Xcode sees a cycle
# (the scripts read the finished app folder the copy writes into).
app.build_phases.delete(embed)
app.build_phases.insert(app.build_phases.index { |ph| ph.display_name == 'Embed Foundation Extensions' } + 1, embed)

project.save
puts 'Added FlexCoachWatch.'
