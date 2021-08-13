package com.trackable;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.content.res.Resources;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.potpie.tracker.LocationTrackerGrpc;
import org.potpie.tracker.Locationtracker;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.Provider;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManagerFactory;
import javax.security.auth.x500.X500Principal;

import io.grpc.ChannelCredentials;
import io.grpc.Grpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.TlsChannelCredentials;
import io.grpc.okhttp.OkHttpChannelBuilder;
import io.grpc.okhttp.internal.Platform;
import io.grpc.stub.StreamObserver;

public class RNTrackerModule extends ReactContextBaseJavaModule implements ActivityEventListener, LifecycleEventListener {
    private ManagedChannel channel;
    private Map<String, Session> sessions = new HashMap<String, Session>();

    public RNTrackerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNTracker";
    }

    @Override
    public void onHostResume() {

    }

    @Override
    public void onHostPause() {

    }

    @Override
    public void onHostDestroy() {
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    }

    @Override
    public void onNewIntent(Intent intent) {
    }

    @Override
    public void initialize() {
        super.initialize();
    }

    @ReactMethod
    public void createService(String hostport, boolean useTLS) {
        String[] split = hostport.split(":");
        try {
            int port = Integer.valueOf(split[1]);
            if (useTLS) {
                AssetManager assetManager = getReactApplicationContext().getAssets();
                InputStream cert = assetManager.open("locationtracker-crt.pem", 0);
                ChannelCredentials credentials = TlsChannelCredentials.newBuilder().trustManager(cert).build();
                ManagedChannelBuilder<?> channelBuilder = Grpc.newChannelBuilderForAddress(split[0], port, credentials);
                channel = channelBuilder
                        .overrideAuthority("locationtracker")
                        .build();
            } else {
                channel = ManagedChannelBuilder.forAddress(split[0], port).usePlaintext().build();
            }
        } catch (Exception e) {
            Log.d("RNTracker", "Failed to create channel", e);
        }
    }

    @ReactMethod
    public void register(String userName, boolean isTrackable, Promise promise) {
        try {
            LocationTrackerGrpc.LocationTrackerBlockingStub blockingStub = LocationTrackerGrpc.newBlockingStub(channel);
            Locationtracker.RegisterRequest req = Locationtracker.RegisterRequest.newBuilder()
                    .setUserName(userName)
                    .setTrackable(isTrackable)
                    .build();
            Locationtracker.RegisterResponse resp = blockingStub.register(req);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getTrackables(Promise promise) {
        try {
            LocationTrackerGrpc.LocationTrackerBlockingStub blockingStub = LocationTrackerGrpc.newBlockingStub(channel);
            Locationtracker.GetTrackablesRequest req = Locationtracker.GetTrackablesRequest.newBuilder().build();
            Locationtracker.GetTrackablesResponse resp = blockingStub.getTrackables(req);
            WritableArray array = Arguments.createArray();
            for (String trackable : resp.getUserNameList()) {
                array.pushString(trackable);
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void startSession(String userName, Promise promise) {
        try {
            LocationTrackerGrpc.LocationTrackerBlockingStub blockingStub = LocationTrackerGrpc.newBlockingStub(channel);
            Locationtracker.StartSessionRequest req = Locationtracker.StartSessionRequest.newBuilder()
                    .setUserName(userName)
                    .build();
            Locationtracker.StartSessionResponse resp = blockingStub.startSession(req);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void stopSession(String userName, Promise promise) {
        try {
            LocationTrackerGrpc.LocationTrackerBlockingStub blockingStub = LocationTrackerGrpc.newBlockingStub(channel);
            Locationtracker.StopSessionRequest req = Locationtracker.StopSessionRequest.newBuilder()
                    .setUserName(userName)
                    .build();
            Locationtracker.StopSessionResponse resp = blockingStub.stopSession(req);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void startTracking(String trackeeName, String userName) {
        LocationTrackerGrpc.LocationTrackerStub asyncStub = LocationTrackerGrpc.newStub(channel);
        Locationtracker.StartTrackingRequest req = Locationtracker.StartTrackingRequest.newBuilder()
                .setTrackeeName(trackeeName)
                .setUserName(userName)
                .build();
        final CountDownLatch finishLatch = new CountDownLatch(1);
        asyncStub.startTracking(req,
        new StreamObserver<Locationtracker.TrackingData>() {
            @Override
            public void onNext(Locationtracker.TrackingData td) {
                WritableMap m = Arguments.createMap();
                m.putString("trackee", td.getTrackeeName());
                m.putDouble("latitude", td.getLatitude());
                m.putDouble("longitude", td.getLongitude());
                m.putDouble("timestamp", td.getTimestamp());
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnTrackingData", m);
            }

            @Override
            public void onError(Throwable t) {
                WritableMap m = Arguments.createMap();
                m.putString("msg", t.getLocalizedMessage());
                m.putInt("code", 0);
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnTrackingError", m);
                finishLatch.countDown();
            }

            @Override
            public void onCompleted() {
                finishLatch.countDown();
            }
        });
    }

    @ReactMethod
    public void stopTracking(String trackeeName, String userName, Promise promise) {
        try {
            LocationTrackerGrpc.LocationTrackerBlockingStub blockingStub = LocationTrackerGrpc.newBlockingStub(channel);
            Locationtracker.StopTrackingRequest req = Locationtracker.StopTrackingRequest.newBuilder()
                    .setTrackeeName(trackeeName)
                    .setUserName(userName)
                    .build();
            Locationtracker.StopTrackingResponse resp = blockingStub.stopTracking(req);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void startReporting(String userName, Promise promise) {
        Session session = sessions.get(userName);
        if (session != null) {
            sessions.remove(userName);
            session.close();
            session = null;
        }
        LocationTrackerGrpc.LocationTrackerStub asyncStub = LocationTrackerGrpc.newStub(channel);
        session = new Session(asyncStub);
        sessions.put(userName, session);
        promise.resolve(null);
    }

    @ReactMethod
    public void reportLocation(String userName, double latitude, double longitude, double timestamp) {
        Session session = sessions.get(userName);
        Locationtracker.TrackingData td = Locationtracker.TrackingData.newBuilder()
                .setLatitude(latitude)
                .setLongitude(longitude)
                .setTimestamp(Double.valueOf(timestamp).longValue())
                .build();
        session.reportLocation(td);
    }

    @ReactMethod
    public void stopReporting(String userName) {
        Session session = sessions.remove(userName);
        session.close();
    }

    @ReactMethod
    public void getSessionIds(String userName, Promise promise) {
        try {
            LocationTrackerGrpc.LocationTrackerBlockingStub blockingStub = LocationTrackerGrpc.newBlockingStub(channel);
            Locationtracker.SessionIdsRequest req = Locationtracker.SessionIdsRequest.newBuilder()
                    .setUserName(userName)
                    .build();
            Locationtracker.SessionIdsResponse resp = blockingStub.getSessionIds(req);
            WritableArray array = Arguments.createArray();
            for (Locationtracker.SessionId sessionId : resp.getSessionIdList()) {
                WritableMap m = Arguments.createMap();
                m.putDouble("sessionId", sessionId.getSessionId());
                m.putDouble("timestamp", sessionId.getTimestamp());
                array.pushMap(m);
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getSessionData(double sessionId, Promise promise) {
        try {
            LocationTrackerGrpc.LocationTrackerBlockingStub blockingStub = LocationTrackerGrpc.newBlockingStub(channel);
            Locationtracker.SessionDataRequest req = Locationtracker.SessionDataRequest.newBuilder()
                    .setSessionId(Double.valueOf(sessionId).longValue())
                    .build();
            Locationtracker.SessionDataResponse resp = blockingStub.getSessionData(req);
            WritableArray array = Arguments.createArray();
            for (Locationtracker.TrackingData td : resp.getTrackingDataList()) {
                WritableMap m = Arguments.createMap();
                m.putString("trackee", td.getTrackeeName());
                m.putDouble("latitude", td.getLatitude());
                m.putDouble("longitude", td.getLongitude());
                m.putDouble("timestamp", td.getTimestamp());
                array.pushMap(m);
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    public class Session {
        private final CountDownLatch finishLatch = new CountDownLatch(1);
        private StreamObserver<Locationtracker.TrackingData> requestObserver;

        public Session(LocationTrackerGrpc.LocationTrackerStub asyncStub) {
            StreamObserver<Locationtracker.ReportLocationResponse> responseObserver = new StreamObserver<Locationtracker.ReportLocationResponse>() {
                @Override
                public void onNext(Locationtracker.ReportLocationResponse value) {
                }

                @Override
                public void onError(Throwable t) {
                    WritableMap m = Arguments.createMap();
                    m.putString("msg", t.getLocalizedMessage());
                    m.putInt("code", 0);
                    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("OnReportingError", m);
                    finishLatch.countDown();
                }

                @Override
                public void onCompleted() {
                    finishLatch.countDown();
                }
            };
            requestObserver = asyncStub.reportLocation(responseObserver);
        }

        public void reportLocation(Locationtracker.TrackingData td) {
            requestObserver.onNext(td);
        }

        public void close() {
            requestObserver.onCompleted();
            try {
                if (!finishLatch.await(1, TimeUnit.MINUTES)) {
                    throw new RuntimeException("Could not finish rpc within 1 minute, the server is likely down");
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}