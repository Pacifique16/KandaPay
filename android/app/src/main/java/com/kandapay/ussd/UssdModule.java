package com.kandapay.ussd;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.List;

public class UssdModule extends ReactContextBaseJavaModule {

    public UssdModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "UssdModule";
    }

    @ReactMethod
    public void getActiveSimCards(Promise promise) {
        try {
            SubscriptionManager sm = (SubscriptionManager) getReactApplicationContext()
                    .getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
            List<SubscriptionInfo> sims = sm.getActiveSubscriptionInfoList();
            WritableArray result = Arguments.createArray();
            if (sims != null) {
                for (SubscriptionInfo info : sims) {
                    WritableMap sim = Arguments.createMap();
                    sim.putInt("slotIndex", info.getSimSlotIndex());
                    sim.putString("operatorName", info.getCarrierName().toString());
                    sim.putString("iccId", info.getIccId());
                    sim.putInt("subscriptionId", info.getSubscriptionId());
                    result.pushMap(sim);
                }
            }
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SIM_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void sendUssdRequest(String ussdCode, int simSlot, Promise promise) {
        try {
            Uri uri = Uri.fromParts("tel", ussdCode, null);
            Intent intent = new Intent(Intent.ACTION_CALL, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            SubscriptionManager sm = (SubscriptionManager) getReactApplicationContext()
                    .getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
            List<SubscriptionInfo> sims = sm.getActiveSubscriptionInfoList();
            if (sims != null && !sims.isEmpty()) {
                for (SubscriptionInfo info : sims) {
                    if (info.getSimSlotIndex() == simSlot) {
                        TelecomManager tm = (TelecomManager) getReactApplicationContext()
                                .getSystemService(Context.TELECOM_SERVICE);
                        for (PhoneAccountHandle handle : tm.getCallCapablePhoneAccounts()) {
                            if (handle.getId().contains(String.valueOf(info.getSubscriptionId()))) {
                                intent.putExtra(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, handle);
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            getReactApplicationContext().startActivity(intent);
            promise.resolve("USSD dialed");
        } catch (Exception e) {
            promise.reject("USSD_ERROR", e.getMessage());
        }
    }
}
