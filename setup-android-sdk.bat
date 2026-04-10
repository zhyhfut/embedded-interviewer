@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ========================================
echo   安卓构建工具安装脚本
echo   将安装 Java JDK 17 和 Android SDK 到 D:\
echo ========================================
echo.

set JAVA_DIR=D:\Java\jdk-17
set ANDROID_DIR=D:\Android\sdk

:: 创建目录
if not exist "D:\Java" mkdir "D:\Java"
if not exist "D:\Android\sdk" mkdir "D:\Android\sdk"

:: ============================================
:: 第一步：下载 Java JDK 17
:: ============================================
echo [1/3] 下载 Java JDK 17...
echo.

set JAVA_ZIP=D:\Java\jdk-17.zip

if exist "%JAVA_DIR%\bin\java.exe" (
    echo   Java JDK 已安装，跳过下载
    goto :install_android
)

echo   正在从 Adoptium 下载 JDK 17（约 180MB，请耐心等待）...
echo   如果下载失败，请手动下载并解压到 %JAVA_DIR%
echo   下载地址: https://adoptium.net/temurin/releases/?version=17
echo.

:: 使用 PowerShell 下载（Windows 自带，更可靠）
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_x64_windows_hotspot_17.0.13_11.zip' -OutFile '%JAVA_ZIP%'" 2>nul

if not exist "%JAVA_ZIP%" (
    echo   PowerShell 下载失败，尝试使用 curl...
    curl -L -o "%JAVA_ZIP%" "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_x64_windows_hotspot_17.0.13_11.zip"
)

if not exist "%JAVA_ZIP%" (
    echo.
    echo   [错误] Java JDK 下载失败！
    echo   请手动下载并解压到 %JAVA_DIR%
    echo   下载地址: https://adoptium.net/temurin/releases/?version=17
    echo.
    pause
    exit /b 1
)

echo   解压 Java JDK...
powershell -Command "Expand-Archive -Path '%JAVA_ZIP%' -DestinationPath 'D:\Java' -Force"
del "%JAVA_ZIP%" 2>nul

:: 查找解压后的目录（可能有版本号后缀）
for /d %%d in (D:\Java\jdk-17*) do (
    if exist "%%d\bin\java.exe" (
        if not "%%d"=="%JAVA_DIR%" (
            ren "%%d" "jdk-17" 2>nul
            if errorlevel 1 (
                set JAVA_DIR=%%d
            )
        )
    )
)

if not exist "%JAVA_DIR%\bin\java.exe" (
    :: 尝试找到实际路径
    for /d %%d in (D:\Java\jdk-17*) do (
        if exist "%%d\bin\java.exe" set JAVA_DIR=%%d
    )
)

echo   Java JDK 安装完成: %JAVA_DIR%

:install_android
:: ============================================
:: 第二步：下载 Android 命令行工具
:: ============================================
echo.
echo [2/3] 下载 Android SDK 命令行工具...
echo.

set CMDLINE_ZIP=D:\Android\cmdline-tools.zip

if exist "%ANDROID_DIR%\cmdline-tools\bin\sdkmanager.bat" (
    echo   Android SDK 命令行工具已安装，跳过下载
    goto :install_sdk_packages
)

echo   正在下载 Android 命令行工具（约 130MB）...

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile '%CMDLINE_ZIP%'" 2>nul

if not exist "%CMDLINE_ZIP%" (
    curl -L -o "%CMDLINE_ZIP%" "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
)

if not exist "%CMDLINE_ZIP%" (
    echo.
    echo   [错误] Android SDK 下载失败！
    echo   请手动下载并解压
    echo   下载地址: https://developer.android.com/studio#command-tools
    echo.
    pause
    exit /b 1
)

echo   解压 Android 命令行工具...
:: 按照 Android SDK 要求的目录结构解压
if not exist "%ANDROID_DIR%\cmdline-tools" mkdir "%ANDROID_DIR%\cmdline-tools"
powershell -Command "Expand-Archive -Path '%CMDLINE_ZIP%' -DestinationPath '%ANDROID_DIR%\cmdline-tools-tmp' -Force"
move "%ANDROID_DIR%\cmdline-tools-tmp\cmdline-tools" "%ANDROID_DIR%\cmdline-tools\latest" >nul 2>&1
rmdir /s /q "%ANDROID_DIR%\cmdline-tools-tmp" 2>nul
del "%CMDLINE_ZIP%" 2>nul

echo   Android SDK 命令行工具安装完成

:install_sdk_packages
:: ============================================
:: 第三步：安装 Android SDK 包
:: ============================================
echo.
echo [3/3] 安装 Android SDK 包（platform-tools, platform, build-tools）...
echo   这步需要接受 Android SDK 许可协议
echo.

set PATH=%JAVA_DIR%\bin;%ANDROID_DIR%\cmdline-tools\latest\bin;%PATH%
set JAVA_HOME=%JAVA_DIR%
set ANDROID_HOME=%ANDROID_DIR%
set ANDROID_SDK_ROOT=%ANDROID_DIR%

:: 接受所有许可协议
echo y | "%ANDROID_DIR%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses 2>nul

:: 安装必要的 SDK 包
"%ANDROID_DIR%\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo   Java: %JAVA_DIR%
echo   Android SDK: %ANDROID_DIR%
echo.
echo   请将以下环境变量添加到系统环境变量中：
echo.
echo   JAVA_HOME=%JAVA_DIR%
echo   ANDROID_HOME=%ANDROID_DIR%
echo   Path 中添加:
echo     %JAVA_DIR%\bin
echo     %ANDROID_DIR%\cmdline-tools\latest\bin
echo     %ANDROID_DIR%\platform-tools
echo.
echo   设置完成后，运行以下命令构建 APK：
echo     cd frontend
echo     npm run build
echo     npx cap sync
echo     cd android
echo     .\gradlew assembleDebug
echo.
echo   生成的 APK 位于：
echo     frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
