Pod::Spec.new do |s|
  s.name           = 'AppleWalletCapture'
  s.version        = '1.0.0'
  s.summary        = 'Apple Wallet capture native surface'
  s.description    = 'Apple Wallet capture native surface'
  s.author         = 'Budgie'
  s.homepage       = 'https://www.budgie.at'
  s.license        = 'MIT'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.0'
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = 'ios/**/*.{h,m,mm,swift,hpp,cpp}'
end
