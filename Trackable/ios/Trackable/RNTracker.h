//
//  RNTracker.h
//  Example
//
//  Created by Richard Backhouse on 5/8/21.
//

#ifndef RNTracker_h
#define RNTracker_h

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import <Tracker/Tracker.h>

@interface RNTracker : RCTEventEmitter <RCTBridgeModule, GRPCProtoResponseHandler>
- (id) init;
@property (strong, nonatomic) Tracker *tracker;
@end

#endif /* RNTracker_h */
