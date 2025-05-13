package com.yourapp;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.io.IOException;
import java.io.InputStream;

public class ImageColorPickerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ImageColorPickerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "ImageColorPicker";
    }

    @ReactMethod
    public void getColorAtPoint(String imageUri, float x, float y, Promise promise) {
        try {
            Bitmap bitmap = getBitmapFromUri(imageUri);
            if (bitmap == null) {
                promise.reject("ERROR", "无法加载图片");
                return;
            }

            // 确保坐标在图片范围内
            int pixelX = Math.min(Math.max(0, (int) x), bitmap.getWidth() - 1);
            int pixelY = Math.min(Math.max(0, (int) y), bitmap.getHeight() - 1);

            // 获取像素颜色
            int pixel = bitmap.getPixel(pixelX, pixelY);
            
            // 返回颜色信息
            WritableMap colorInfo = createColorInfo(pixel);
            promise.resolve(colorInfo);
            
            // 回收位图
            bitmap.recycle();
        } catch (Exception e) {
            promise.reject("ERROR", "获取颜色失败: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getColorInArea(String imageUri, float startX, float startY, float endX, float endY, Promise promise) {
        try {
            Bitmap bitmap = getBitmapFromUri(imageUri);
            if (bitmap == null) {
                promise.reject("ERROR", "无法加载图片");
                return;
            }

            // 确保坐标在图片范围内
            int left = Math.max(0, (int) Math.min(startX, endX));
            int top = Math.max(0, (int) Math.min(startY, endY));
            int right = Math.min(bitmap.getWidth() - 1, (int) Math.max(startX, endX));
            int bottom = Math.min(bitmap.getHeight() - 1, (int) Math.max(startY, endY));

            // 计算区域内的平均颜色
            long totalR = 0, totalG = 0, totalB = 0;
            int pixelCount = 0;

            for (int y = top; y <= bottom; y++) {
                for (int x = left; x <= right; x++) {
                    int pixel = bitmap.getPixel(x, y);
                    totalR += Color.red(pixel);
                    totalG += Color.green(pixel);
                    totalB += Color.blue(pixel);
                    pixelCount++;
                }
            }

            if (pixelCount > 0) {
                int avgR = (int) (totalR / pixelCount);
                int avgG = (int) (totalG / pixelCount);
                int avgB = (int) (totalB / pixelCount);
                int avgColor = Color.rgb(avgR, avgG, avgB);
                
                // 返回颜色信息
                WritableMap colorInfo = createColorInfo(avgColor);
                promise.resolve(colorInfo);
            } else {
                promise.reject("ERROR", "选择区域无效");
            }
            
            // 回收位图
            bitmap.recycle();
        } catch (Exception e) {
            promise.reject("ERROR", "获取区域颜色失败: " + e.getMessage());
        }
    }

    private Bitmap getBitmapFromUri(String imageUri) throws IOException {
        Uri uri = Uri.parse(imageUri);
        InputStream inputStream = reactContext.getContentResolver().openInputStream(uri);
        return BitmapFactory.decodeStream(inputStream);
    }

    private WritableMap createColorInfo(int color) {
        WritableMap colorInfo = Arguments.createMap();
        int r = Color.red(color);
        int g = Color.green(color);
        int b = Color.blue(color);
        
        colorInfo.putInt("r", r);
        colorInfo.putInt("g", g);
        colorInfo.putInt("b", b);
        
        // 转换为十六进制
        String hex = String.format("%02X%02X%02X", r, g, b);
        colorInfo.putString("hex", hex);
        
        return colorInfo;
    }
} 