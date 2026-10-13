Pod::Spec.new do |s|
  s.name           = 'BackgroundSync'
  s.version        = '1.0.0'
  s.summary        = 'Keeps bank sync running while the app is in the background'
  s.license        = 'MIT'
  s.author         = 'budgie'
  s.homepage       = 'https://www.budgie.at'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
