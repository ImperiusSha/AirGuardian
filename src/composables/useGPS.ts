export function useGPS() {
    const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            };
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve(position);
                },
                error => {
                    console.error("GPS-Fehler:", error.message);
                    reject(error);
                },
                options
            );
        });
    };
    return { getCurrentPosition };
}
