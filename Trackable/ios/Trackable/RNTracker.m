//
//  RNTracker.m
//  Example
//
//  Created by Richard Backhouse on 5/8/21.
//

#import <Foundation/Foundation.h>
#import "RNTracker.h"

@implementation RNTracker

- (id)init {
  self = [super init];
  return self;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(createService:(NSString *)host useTLS:(BOOL) useTLS) {
  GRPCMutableCallOptions *options = [[GRPCMutableCallOptions alloc] init];
  if (useTLS) {
    options.transport = GRPCDefaultTransportImplList.core_secure;
    NSString *crtPath = [[NSBundle mainBundle] pathForResource:@"locationtracker-crt" ofType:@"pem"];
    NSError *error;
    options.PEMRootCertificates = [NSString stringWithContentsOfFile:crtPath encoding:NSUTF8StringEncoding error:&error];
    options.hostNameOverride = @"locationtracker";
    options.serverAuthority = @"locationtracker";
  } else {
    options.transport = GRPCDefaultTransportImplList.core_insecure;
  }
  NSLog(@"createService:  %@", host);

  self.tracker = [[Tracker alloc] initWithHost:host options:options];
}

RCT_EXPORT_METHOD(register:(NSString *) userName isTrackable:(BOOL) isTrackable resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(RegisterResponse *response, NSError *error) = ^(RegisterResponse *response, NSError *error) {
    if (response) {
      NSLog(@"Registered UserId message %lld", response.userId);
      resolve(nil);
    } else {
      NSLog(@"Register Error %d %@", error.code, error.localizedDescription);
      reject(@"register_failure", error.localizedDescription, error);
    }
  };
  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];
  [self.tracker register:userName isTrackable:isTrackable handler:h];
}

RCT_EXPORT_METHOD(getTrackables:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(GetTrackablesResponse *response, NSError *error) = ^(GetTrackablesResponse *response, NSError *error) {
    if (response) {
      NSMutableArray *data = [[NSMutableArray alloc] init];
      void (^handler)(NSString * _Nonnull trackable , NSUInteger idx , BOOL *stop) = ^(NSString * _Nonnull trackable , NSUInteger idx , BOOL *stop){
        [data addObject:trackable];
      };

      [response.userNameArray enumerateObjectsUsingBlock:handler];
      resolve(data);
    } else {
      reject(@"gettrackables_failure", error.localizedDescription, error);
    }
  };
  
  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];

  [self.tracker getTrackables:h];
}

RCT_EXPORT_METHOD(startSession:(NSString *)userName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(StartSessionResponse *response, NSError *error) = ^(StartSessionResponse *response, NSError *error) {
    if (response) {
      resolve(nil);
    } else {
      NSLog(@"Start Session error %@", error);
      reject(@"startsession_failure", error.localizedDescription, error);
    }
  };
  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];
  
  [self.tracker startSession:userName handler:h];
}

RCT_EXPORT_METHOD(stopSession:(NSString *)userName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(StopSessionResponse *response, NSError *error) = ^(StopSessionResponse *response, NSError *error) {
    if (response) {
      resolve(nil);
    } else {
      NSLog(@"Stop Session error %@", error);
      reject(@"stopsession_failure", error.localizedDescription, error);
    }
  };
  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];
  [self.tracker stopSession:userName handler:h];
}

RCT_EXPORT_METHOD(startTracking:(NSString *) trackeeName userName:(NSString *) userName) {
  [self.tracker startTracking:trackeeName userName:userName handler:self];
}

RCT_EXPORT_METHOD(stopTracking:(NSString *) trackeeName userName:(NSString *) userName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(StopTrackingResponse *response, NSError *error) = ^(StopTrackingResponse *response, NSError *error) {
    if (response) {
      resolve(nil);
    } else {
      NSLog(@"Stop Tracking error %@", error);
      reject(@"stoptracking_failure", error.localizedDescription, error);
    }
  };
  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];
  [self.tracker stopTracking:trackeeName userName:userName handler:h];
}

RCT_EXPORT_METHOD(startReporting:(NSString *)userName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(ReportLocationResponse *response, NSError *error) = ^(ReportLocationResponse *response, NSError *error) {
    if (response) {
      //resolve(nil);
    } else {
      NSLog(@"Start Reporting error %@", error);
      //reject(@"startreporting_failure", @"startreporting failure", error);
    }
  };

  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];
  [self.tracker startReporting:userName handler:h];
  resolve(nil);
}

RCT_EXPORT_METHOD(reportLocation:(NSString *) userName latitude:(double) latitude longitude:(double)longitude timestamp:(double)timestamp) {
  [self.tracker reportLocation:userName latitude:latitude longitude:longitude timestamp:timestamp];
}

RCT_EXPORT_METHOD(stopReporting:(NSString *) userName) {
  [self.tracker stopReporting:userName];
}

RCT_EXPORT_METHOD(getSessionIds:(NSString *)userName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(SessionIdsResponse *response, NSError *error) = ^(SessionIdsResponse *response, NSError *error) {
    if (response) {
      NSMutableArray *ids = [[NSMutableArray alloc] init];
      void (^handler)(SessionId * value , NSUInteger idx , BOOL *stop) = ^(SessionId * value , NSUInteger idx , BOOL *stop){
        NSLog(@"SessionId %lld", value.timestamp);

        NSDictionary *d = @{
          @"sessionId": [NSNumber numberWithDouble:value.sessionId],
          @"timestamp": [NSNumber numberWithDouble:value.timestamp]
        };

        [ids addObject:d];
      };
      [response.sessionIdArray enumerateObjectsUsingBlock:handler];
      
      resolve(ids);
    } else {
      reject(@"getsessionids_failure", error.localizedDescription, error);
    }
  };
  
  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];
  [self.tracker getSessionIds:userName handler:h];
}

RCT_EXPORT_METHOD(getSessionData:(NSNumber *_Nonnull)sessionId resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  void (^handler)(SessionDataResponse *response, NSError *error) = ^(SessionDataResponse *response, NSError *error) {
    if (response) {
      NSMutableArray *data = [[NSMutableArray alloc] init];
      void (^handler)(TrackingData * _Nonnull td , NSUInteger idx , BOOL *stop) = ^(TrackingData * _Nonnull td , NSUInteger idx , BOOL *stop){
        NSDictionary *d = @{
          @"trackee": td.trackeeName,
          @"latitude": [NSNumber numberWithDouble:td.latitude],
          @"longitude": [NSNumber numberWithDouble:td.longitude],
          @"timestamp": [NSNumber numberWithDouble:td.timestamp]
        };
        [data addObject:d];
      };
      [response.trackingDataArray enumerateObjectsUsingBlock:handler];
      resolve(data);
    } else {
      reject(@"getsessiondata_failure", error.localizedDescription, error);
    }
  };
  
  GRPCUnaryResponseHandler* h = [[GRPCUnaryResponseHandler alloc] initWithResponseHandler:handler responseDispatchQueue:nil];
  [self.tracker getSessionData:sessionId handler:h];
}


- (NSArray<NSString *> *)supportedEvents {
  return @[@"OnTrackingData"];
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)didReceiveProtoMessage:(GPBMessage *)message {
  if ([message isKindOfClass:[TrackingData class]]) {
    TrackingData *trackingData = (TrackingData *)message;
    [self sendEventWithName:@"OnTrackingData"
                       body:@{@"trackee": trackingData.trackeeName,
                              @"latitude": [NSNumber numberWithDouble:trackingData.latitude],
                              @"longitude": [NSNumber numberWithDouble:trackingData.longitude],
                              @"timestamp": [NSNumber numberWithDouble:trackingData.timestamp]}];
  }
}

- (void)didCloseWithTrailingMetadata:(NSDictionary *)trailingMetadata error:(NSError *)error {
  if (error) {
  }
}

@synthesize dispatchQueue;

@end
