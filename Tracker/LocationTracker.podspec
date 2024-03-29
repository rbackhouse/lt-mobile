Pod::Spec.new do |s|
    s.name     = 'Tracker'
    s.version  = '0.0.1'
    s.license  = 'MIT'
    s.authors  = { 'Richard Backhouse' => 'richardabackhouse@gmail.com' }
    s.homepage = 'https://github.com/rbackhouse/LocationTracker'
    s.summary = 'Location Tracker gRPC Client for iOS'
    s.source = { :git => 'https://github.com/rbackhouse/LocationTracker/lt-mobile' }
    s.source_files = "Tracker", "Tracker/**/*.{h,m}"

    s.ios.deployment_target = '9.0'
    s.osx.deployment_target = '10.10'
  
    # Base directory where the .proto files are.
    src = '../../../lt-service/proto/'
  
    # We'll use protoc with the gRPC plugin.
    s.dependency '!ProtoCompiler-gRPCPlugin', '~> 1.0'
  
    # Pods directory corresponding to this app's Podfile, relative to the location of this podspec.
    pods_root = "Pods"
  
    # Path where Cocoapods downloads protoc and the gRPC plugin.
    protoc_dir = "#{pods_root}/!ProtoCompiler"
    protoc = "#{protoc_dir}/protoc"
    plugin = "#{pods_root}/!ProtoCompiler-gRPCPlugin/grpc_objective_c_plugin"
  
    # Directory where you want the generated files to be placed. This is an example.
    dir = "#{pods_root}/#{s.name}"
  
    # Run protoc with the Objective-C and gRPC plugins to generate protocol messages and gRPC clients.
    # You can run this command manually if you later change your protos and need to regenerate.
    # Alternatively, you can advance the version of this podspec and run `pod update`.
    s.prepare_command = <<-CMD
      mkdir -p #{dir}
      #{protoc} \
          --plugin=protoc-gen-grpc=#{plugin} \
          --objc_out=#{dir} \
          --grpc_out=#{dir} \
          -I #{src} \
          -I #{protoc_dir} \
          #{src}/*.proto
    CMD
  
    # The --objc_out plugin generates a pair of .pbobjc.h/.pbobjc.m files for each .proto file.
    s.subspec 'Messages' do |ms|
      ms.source_files = "#{dir}/*.pbobjc.{h,m}"
      ms.header_mappings_dir = dir
      ms.requires_arc = false
      # The generated files depend on the protobuf runtime.
      ms.dependency 'Protobuf'
    end
  
    # The --objcgrpc_out plugin generates a pair of .pbrpc.h/.pbrpc.m files for each .proto file with
    # a service defined.
    s.subspec 'Services' do |ss|
      ss.source_files = "#{dir}/*.pbrpc.{h,m}"
      ss.header_mappings_dir = dir
      ss.requires_arc = true
      # The generated files depend on the gRPC runtime, and on the files generated by `--objc_out`.
      ss.dependency 'gRPC-ProtoRPC'
      ss.dependency "#{s.name}/Messages"
    end
  
    s.pod_target_xcconfig = {
      # This is needed by all pods that depend on Protobuf:
      'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) GPB_USE_PROTOBUF_FRAMEWORK_IMPORTS=1',
      # This is needed by all pods that depend on gRPC-RxLibrary:
      'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES' => 'YES',
    }
  end