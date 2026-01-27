package com.whereismymoney;

import android.app.Notification;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;
import android.util.Log;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 支付通知监听服务
 * 监听微信和支付宝的支付通知
 */
public class PaymentNotificationService extends NotificationListenerService {

    private static final String TAG = "PaymentNotification";

    // 支持的支付应用包名
    private static final Set<String> PAYMENT_PACKAGES = new HashSet<>(Arrays.asList(
            "com.tencent.mm",              // 微信
            "com.eg.android.AlipayGphone"  // 支付宝
    ));

    // 支付相关关键词
    private static final String[] PAYMENT_KEYWORDS = {
            "支付", "付款", "收款", "到账", "扣款", "转账",
            "成功", "￥", "¥", "元"
    };

    // 回调接口
    public interface PaymentCallback {
        void onPaymentDetected(String packageName, String title, String content, long timestamp);
    }

    private static PaymentCallback sPaymentCallback;

    /**
     * 设置支付通知回调
     */
    public static void setPaymentCallback(PaymentCallback callback) {
        sPaymentCallback = callback;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "PaymentNotificationService onCreate");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "PaymentNotificationService onDestroy");
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "NotificationListener connected");
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        Log.d(TAG, "NotificationListener disconnected");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();

        // 检查是否是支付应用
        if (!PAYMENT_PACKAGES.contains(packageName)) {
            return;
        }

        try {
            Notification notification = sbn.getNotification();
            if (notification == null) return;

            Bundle extras = notification.extras;
            if (extras == null) return;

            // 获取通知标题和内容
            String title = getNotificationTitle(extras);
            String content = getNotificationContent(extras);

            // 检查是否包含支付关键词
            if (!containsPaymentKeyword(title, content)) {
                return;
            }

            Log.d(TAG, "Payment notification detected: " + packageName);
            Log.d(TAG, "Title: " + title);
            Log.d(TAG, "Content: " + content);

            // 调用回调
            if (sPaymentCallback != null) {
                sPaymentCallback.onPaymentDetected(
                        packageName,
                        title,
                        content,
                        sbn.getPostTime()
                );
            }

        } catch (Exception e) {
            Log.e(TAG, "Error processing notification", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // 通知被移除时的处理（可选）
    }

    /**
     * 获取通知标题
     */
    private String getNotificationTitle(Bundle extras) {
        CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
        if (title != null) {
            return title.toString();
        }
        return "";
    }

    /**
     * 获取通知内容
     */
    private String getNotificationContent(Bundle extras) {
        StringBuilder content = new StringBuilder();

        // 获取主要文本
        CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
        if (text != null) {
            content.append(text.toString());
        }

        // 获取大文本（如果有）
        CharSequence bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        if (bigText != null && !bigText.toString().equals(text != null ? text.toString() : "")) {
            if (content.length() > 0) {
                content.append(" ");
            }
            content.append(bigText.toString());
        }

        // 获取子文本
        CharSequence subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
        if (subText != null) {
            if (content.length() > 0) {
                content.append(" ");
            }
            content.append(subText.toString());
        }

        // 获取信息行（适用于消息样式通知）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            CharSequence[] textLines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
            if (textLines != null) {
                for (CharSequence line : textLines) {
                    if (line != null) {
                        if (content.length() > 0) {
                            content.append(" ");
                        }
                        content.append(line.toString());
                    }
                }
            }
        }

        return content.toString();
    }

    /**
     * 检查是否包含支付关键词
     */
    private boolean containsPaymentKeyword(String title, String content) {
        String combined = (title + " " + content).toLowerCase();
        
        for (String keyword : PAYMENT_KEYWORDS) {
            if (combined.contains(keyword.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}
