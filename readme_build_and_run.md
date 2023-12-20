# Build and run environment

## Prerequierments
1. Install NPM ans system requiements
   ```sh
   sudo snap install --classic node
   sudo npm install -g @ionic/cli
   ```
2. Install NPM prerequirements of repository (*package.json must be present*)
   ```sh
   npm install
   ```
   
## Build
```sh
ionic build
```

## Start manually
- Webapp *[localhost](http://localhost:8100)*
  ```sh
  ionic serve 
  ```
- Webapp *network*
  ```sh
  ionic serve --host 0.0.0.0 --port 8100
  ```
- Android App (*Android Studio has been installed via snap*)
  ```sh
  # Change Android-Studio path from /usr/local/android-studio/bin/studio.sh to:
  export CAPACITOR_ANDROID_STUDIO_PATH=/snap/android-studio/current/android-studio/bin/studio.sh
  #ionic cap add android
  ionic cap sync android
  ionic cap build android

  # Connect Smartphone via USB
  ionic cap run android --external
  # OR Compile and Run in Android Studio
  ```

## Start with Docker
### Development
Start app directly. The current directory will be used for caching.  
App will be build on every start (slow start)
```sh
docker compose up
```
### Production
App forwarded by httpd.  
App will be build only on docker build (fast start)  
*Info: You have to create SSL certificates*
```sh
docker compose -f docker-compose.production.yaml up -d
```