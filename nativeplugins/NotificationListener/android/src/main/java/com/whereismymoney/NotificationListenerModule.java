package com.whereismymoney;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import io.dcloud.feature.uniapp.annotation.UniJSMethod;
import io.dcloud.feature.uniapp.bridge.UniJSCallback;
import io.dcloud.feature.uniapp.common.UniModule;

import org.json.JSONObject;

/**
 * 通知监听模块
 * 提供给 uni-app 调用的接口
 */
public class NotificationListenerModule extends UniModule {

    private static final String TAG = "NotificationListener";

    /**
     * 检查通知监听权限是否已开启
     */
    @UniJSMethod(uiThread = false)
    public void isNotificationListenerEnabled(UniJSCallback callback) {
        try {
            Context context = mUniSDKInstance.getContext();
            boolean enabled = isNotificationServiceEnabled(context);
            
            JSONObject result = new JSONObject();
            result.put("enabled", enabled);
            callback.invoke(result);
        } catch (Exception e) {
            e.printStackTrace();
            callback.invoke(createErrorResult(e.getMessage()));
        }
    }

    /**
     * 打开通知监听设置页面
     */
    @UniJSMethod(uiThread = true)
    public void openNotificationListenerSettings(UniJSCallback callback) {
        try {
            Context context = mUniSDKInstance.getContext();
            Intent intent;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            } else {
                intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
            }
            
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            
            JSONObject result = new JSONObject();
            result.put("success", true);
            callback.invoke(result);
        } catch (Exception e) {
            e.printStackTrace();
            callback.invoke(createErrorResult(e.getMessage()));
        }
    }

    /**
     * 启动通知监听服务
     */
    @UniJSMethod(uiThread = true)
    public void startListening(UniJSCallback callback) {
        try {
            Context context = mUniSDKInstance.getContext();
            
            // 检查权限
            if (!isNotificationServiceEnabled(context)) {
                JSONObject result = new JSONObject();
                result.put("success", false);
                result.put("error", "PERMISSION_DENIED");
                result.put("message", "请先开启通知监听权限");
                callback.invoke(result);
                return;
            }
            
            // 设置回调
            PaymentNotificationService.setPaymentCallback(new PaymentNotificationService.PaymentCallback() {
                @Override
                public void onPaymentDetected(String packageName, String title, String content, long timestamp) {
                    try {
                        JSONObject data = new JSONObject();
                        data.put("packageName", packageName);
                        data.put("title", title);
                        data.put("content", content);
                        data.put("timestamp", timestamp);
                        
                        // 通过全局事件发送到 JS
                        if (mUniSDKInstance != null) {
                            mUniSDKInstance.fireGlobalEventCallback("onPaymentNotification", data);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
            
            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("message", "通知监听已启动");
            callback.invoke(result);
        } catch (Exception e) {
            e.printStackTrace();
            callback.invoke(createErrorResult(e.getMessage()));
        }
    }

    /**
     * 停止通知监听
     */
    @UniJSMethod(uiThread = true)
    public void stopListening(UniJSCallback callback) {
        try {
            PaymentNotificationService.setPaymentCallback(null);
            
            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("message", "通知监听已停止");
            callback.invoke(result);
        } catch (Exception e) {
            e.printStackTrace();
            callback.invoke(createErrorResult(e.getMessage()));
        }
    }

    /**
     * 检查通知监听服务是否启用
     */
    private boolean isNotificationServiceEnabled(Context context) {
        String packageName = context.getPackageName();
        String flat = Settings.Secure.getString(context.getContentResolver(),
                "enabled_notification_listeners");
        
        if (!TextUtils.isEmpty(flat)) {
            String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && TextUtils.equals(packageName, cn.getPackageName())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 创建错误结果
     */
    private JSONObject createErrorResult(String message) {
        JSONObject result = new JSONObject();
        try {
            result.put("success", false);
            result.put("error", "ERROR");
            result.put("message", message);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }
}
