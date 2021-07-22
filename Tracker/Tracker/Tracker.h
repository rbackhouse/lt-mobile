//
//  Tracker.h
//  Tracker
//
//  Created by Richard Backhouse on 4/30/21.
//

#import <Foundation/Foundation.h>

//! Project version number for Tracker.
FOUNDATION_EXPORT double TrackerVersionNumber;

//! Project version string for Tracker.
FOUNDATION_EXPORT const unsigned char TrackerVersionString[];

#import <GRPCClient/GRPCTransport.h>
#import <Tracker/Locationtracker.pbrpc.h>
#import <Tracker/Locationtracker.pbobjc.h>

@class Tracker;

@interface Tracker : NSObject

@property (strong, nonatomic, nonnull) LocationTracker *service;
@property (strong, nonatomic, nonnull) NSMutableDictionary<NSString *, GRPCStreamingProtoCall *> *sessions;

-initWithHost:(NSString *_Nonnull) host options:(GRPCMutableCallOptions *_Nonnull) options;
-(void) register:(NSString *_Nonnull) userName isTrackable:(BOOL) isTrackable handler:(GRPCUnaryResponseHandler *_Nonnull)handler;
-(void) getTrackables:(GRPCUnaryResponseHandler *_Nonnull) handler;
-(void) startSession:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler;
-(void) stopSession:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler;
-(void) startTracking:(NSString *_Nonnull) trackeeName userName:(NSString *_Nonnull) userName handler:(id<GRPCProtoResponseHandler>_Nonnull) handler;
-(void) stopTracking:(NSString *_Nonnull) trackeeName userName:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler;
-(void) startReporting:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler;
-(void) reportLocation:(NSString *_Nonnull) userName latitude:(double) latitude longitude:(double)longitude timestamp:(double)timestamp;
-(void) stopReporting:(NSString *_Nonnull) userName;
-(void) getSessionIds:(NSString *_Nonnull) userName handler:(GRPCUnaryResponseHandler *_Nonnull)handler;
-(void) getSessionData:(NSNumber *_Nonnull) sessionId handler:(GRPCUnaryResponseHandler *_Nonnull)handler;
@end
