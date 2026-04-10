@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ========================================
echo   嵌入式面试模拟 - 构建安卓 APK
echo ========================================
echo.

:: 设置环境变量（假设已通过 setup-android-sdk.bat 安装）
set JAVA_HOME=D:\Java\jdk-17
set ANDROID_HOME=D:\Android\sdk
set ANDROID_SDK_ROOT=D:\Android\sdk

:: 查找实际的 JDK 路径
if not exist "%JAVA_HOME%\bin\java.exe" (
    for /d %%d in (D:\Java\jdk-17*) do (
        if exist "%%d\bin\java.exe" set JAVA_HOME=%%d
    )
)

:: 检查 Java
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [错误] 未找到 Java JDK！
    echo 请先运行 setup-android-sdk.bat 安装构建工具
    pause
    exit /b 1
)

:: 检查 Android SDK
if not exist "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" (
    if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
        echo [错误] 未找到 Android SDK！
        echo 请先运行 setup-android-sdk.bat 安装构建工具
        pause
        exit /b 1
    )
)

set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%

echo [1/3] 构建前端...
cd /d "%~dp0frontend"
call npm run build
if errorlevel 1 (
    echo [错误] 前端构建失败！
    pause
    exit /b 1
)
echo   前端构建完成

echo.
echo [2/3] 同步到 Android 项目...
call npx cap sync
if errorlevel 1 (
    echo [错误] Capacitor 同步失败！
    pause
    exit /b 1
)
echo   同步完成

echo.
echo [3/3] 构建 APK...
cd /d "%~dp0frontend\android"
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo [错误] APK 构建失败！
    echo 提示：如果提示 SDK 版本问题，请运行 setup-android-sdk.bat 重新安装
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建成功！
echo ========================================
echo.
echo   APK 位置:
echo   %~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo   安装到手机:
echo   adb install -r "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk"
echo.
pause
