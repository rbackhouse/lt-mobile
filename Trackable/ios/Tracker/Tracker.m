//
//  Tracker.m
//  Tracker
//
//  Created by Richard Backhouse on 4/30/21.
//

#import "Tracker.h"

@implementation Tracker

-initWithHost:(NSString *) host options:(GRPCMutableCallOptions *) options {
    self = [super init];
    self.service = [[LocationTracker alloc] initWithHost:host callOptions:options];
    self.sessions = [[NSMutableDictionary alloc] init];
    self.options = options;
    return self;
}

-(void) register:(NSString *) userName isTrackable:(BOOL) isTrackable handler:(GRPCUnaryResponseHandler *_Nonnull)handler {
    RegisterRequest *request = [RegisterRequest message];
    request.userName = userName;
    request.trackable = isTrackable;
    [[self.service registerWithMessage:request
        responseHandler:handler
        callOptions:nil] start];
}

-(void) getTrackables:(GRPCUnaryResponseHandler *_Nonnull) handler {
    GetTrackablesRequest *request = [GetTrackablesRequest message];
    
    [[self.service getTrackablesWithMessage:request
        responseHandler:handler
        callOptions:nil] start];
}

-(void) startSession:(NSString *) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler {
    StartSessionRequest *request = [StartSessionRequest message];
    request.userName = userName;

    [[self.service startSessionWithMessage:request
        responseHandler:handler
        callOptions:nil] start];
}

-(void) stopSession:(NSString *) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler {
    StopSessionRequest *request = [StopSessionRequest message];
    request.userName = userName;

    [[self.service stopSessionWithMessage:request
        responseHandler:handler
        callOptions:nil] start];
}

-(void) startTracking:(NSString *_Nonnull) trackeeName userName:(NSString *_Nonnull) userName handler:(id<GRPCProtoResponseHandler>)handler {
    StartTrackingRequest *request = [StartTrackingRequest message];
    request.trackeeName = trackeeName;
    request.userName = userName;
    
    [[self.service startTrackingWithMessage:request
        responseHandler:handler
        callOptions:nil] start];
}

-(void) stopTracking:(NSString *_Nonnull) trackeeName userName:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler {
    StopTrackingRequest *request = [StopTrackingRequest message];
    request.trackeeName = trackeeName;
    request.userName = userName;

    [[self.service stopTrackingWithMessage:request
        responseHandler:handler
        callOptions:nil] start];
}

-(void) startReporting:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler {
    GRPCStreamingProtoCall *call = [self.sessions valueForKey:userName];
    if (call != nil) {
        [self.sessions removeObjectForKey:userName];
        [call finish];
        call = nil;
    }
    call = [self.service
            reportLocationWithResponseHandler:handler
            callOptions:nil];
    [call start];
    [self.sessions setObject:call forKey:userName];
}

-(void) reportLocation:(NSString *_Nonnull) userName latitude:(double) latitude longitude:(double)longitude timestamp:(double)timestamp {
    GRPCStreamingProtoCall *call = [self.sessions valueForKey:userName];
    TrackingData *td = [TrackingData message];
    td.latitude = latitude;
    td.longitude = longitude;
    td.trackeeName = userName;
    td.timestamp = timestamp;
    NSLog(@"reportLocation:  %@ %@", userName, td);
    [call writeMessage:td];
}

-(void) stopReporting:(NSString *_Nonnull) userName {
    GRPCStreamingProtoCall *call = [self.sessions valueForKey:userName];
    [self.sessions removeObjectForKey:userName];
    [call finish];
}

-(void) getSessionIds:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler {
    SessionIdsRequest *request = [SessionIdsRequest message];
    request.userName = userName;
    
    [[self.service getSessionIdsWithMessage:request
            responseHandler:handler
            callOptions:nil] start];
}

-(void) getSessionData:(NSNumber *_Nonnull) sessionId handler:(GRPCUnaryResponseHandler *_Nonnull)handler {
    SessionDataRequest *request = [SessionDataRequest message];
    request.sessionId = sessionId.intValue;
    [[self.service getSessionDataWithMessage:request responseHandler:handler callOptions:nil] start];
}

@end

