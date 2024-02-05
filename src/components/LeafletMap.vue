<template>
    <l-map v-if="!loading" ref="leafletMap" id="map" style="width: 100%; height: 100vh" :zoom="zoom" :center="center">
        <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            :attribution="'&copy; <a href=https://www.openstreetmap.org/copyright>OpenStreetMap</a> contributors'"></l-tile-layer>
        <l-marker v-if="currentLocation" :lat-lng="currentLocation"></l-marker>
        <l-marker v-for="data in sensorData" :key="data.id" :lat-lng="data.location" :icon="getIcon()"
            @click="handleIconClick(data)" @touchend="handleIconClick(data)"></l-marker>
        <div v-if="loading"
            style="width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center;">
            <span>Lade Standort...</span>
        </div>
        <location-modal :show="showModal" :data="selectedData" @close="showModal = false"></location-modal>
        <button @click="reloadLocation" class="button-reload">
            <i class="fas fa-home"></i>
        </button>
    </l-map>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import 'leaflet';
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import * as L from 'leaflet';
import { useGPS } from "../composables/useGPS";
import store from '@/store';
import { SensorDataPoint } from '@/store'
import LocationModal from '@/components/LocationModal.vue';

export default defineComponent({
    name: 'LeafletMap',
    components: {
        LMap,
        LTileLayer,
        LMarker,
        LocationModal
    },
    setup() {
        const leafletMap = ref<typeof LMap | null>(null);
        const zoom = ref(17);
        const center = ref<L.PointExpression>([51.505, -0.09]);
        const currentLocation = ref<L.LatLngExpression | null>(null);
        const loading = ref(true);
        const addedCoordinates = ref<Set<string>>(new Set());
        const sensorData = store.getters.sensorData;
        const showModal = ref(false);
        const selectedData = ref({ co2: 0, pm10: 0, pm25: 0, temp: 0, humidity: 0 });
        let intervalId: number | undefined;
        const watchId = ref<number | null>(null);


        function getCurrentCo2Value() {
            return store.getters.latestCo2Value;
        }

        function getCurrentPm10Value() {
            return store.getters.latestPm10Value;
        }

        function getCurrentPm25Value() {
            return store.getters.latestPm25Value;
        }

        function getCurrentTempValue() {
            return store.getters.latestTempValue;
        }

        function getCurrentHumidityValue() {
            return store.getters.latestHumidityValue;
        }

        function getIcon() {
            let iconUrl = '/images/green_flag.png';
            const currentCo2Value = getCurrentCo2Value();
            if (currentCo2Value <= 400) {
                iconUrl = '/images/green_flag.png';
            } else if (currentCo2Value > 400 && currentCo2Value <= 1000) {
                iconUrl = '/images/yellow_flag.png';
            } else if (currentCo2Value > 1000 && currentCo2Value <= 2000) {
                iconUrl = '/images/red_flag.png';
            } else {
                iconUrl = '/images/dark_red_flag.png';
            }

            // Erstellen eines neues Icons für jeden Aufruf
            return L.icon({
                iconUrl: iconUrl,
                iconSize: [20, 20],
                iconAnchor: [10, 41],
                popupAnchor: [-1, -34]
            });
        }

        // Funktion zum Hinzufügen einer Flagge
        const addOrUpdateFlag = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            const key = `${latitude}-${longitude}`;

            if (!addedCoordinates.value.has(key)) {
                const values = {
                    co2: getCurrentCo2Value(),
                    pm10: getCurrentPm10Value(),
                    pm25: getCurrentPm25Value(),
                    temp: getCurrentTempValue(),
                    humidity: getCurrentHumidityValue(),
                };
                const data: SensorDataPoint = {
                    location: { lat: latitude, lng: longitude },
                    values,
                    timestamp: ''
                };
                store.dispatch('addLocationAndData', data);
                addedCoordinates.value.add(key);
            }
        };

        const reloadLocation = async () => {
            loading.value = true;
            try {
                const { getCurrentPosition } = useGPS();
                const position: GeolocationPosition = await getCurrentPosition() as GeolocationPosition;
                center.value = [position.coords.latitude, position.coords.longitude];
                currentLocation.value = center.value;

                const key = `${currentLocation.value[0]}-${currentLocation.value[1]}`;
                if (!addedCoordinates.value.has(key)) {
                    const values = {
                        co2: getCurrentCo2Value(),
                        pm10: getCurrentPm10Value(),
                        pm25: getCurrentPm25Value(),
                        temp: getCurrentTempValue(),
                        humidtiy: getCurrentHumidityValue(),
                    };
                    const data = {
                        location: currentLocation.value,
                        values,
                    };
                    store.dispatch('addLocationAndData', data);
                    addedCoordinates.value.add(key);
                }

                if (leafletMap.value) {
                    leafletMap.value.flyTo(center.value, zoom.value);
                }
            } catch (error) {
            } finally {
                loading.value = false;
            }
        };

        onMounted(async () => {
            try {
                setInterval(async () => {
                    await reloadLocation();
                }, 1 * 10 * 1000);
                const { getCurrentPosition } = useGPS();
                const position: GeolocationPosition = await getCurrentPosition() as GeolocationPosition;
                center.value = [position.coords.latitude, position.coords.longitude];
                currentLocation.value = center.value;
                loading.value = false;
            } catch (error) {
                loading.value = false;
            }
            watchId.value = navigator.geolocation.watchPosition(
                (position) => {
                    currentLocation.value = [position.coords.latitude, position.coords.longitude];
                    if (leafletMap.value) {
                        leafletMap.value.flyTo(currentLocation.value, zoom.value);
                    }
                    addOrUpdateFlag(position);
                },
                (error) => {
                    console.error('Fehler beim Zugriff auf die Geolocation', error);
                },
                {
                    enableHighAccuracy: true
                }
            );

            // Interval zum Hinzufügen einer neuen Flagge alle 15 Sekunden
            intervalId = window.setInterval(() => {
                if (currentLocation.value) {
                    navigator.geolocation.getCurrentPosition(addOrUpdateFlag, console.error, {
                        enableHighAccuracy: true
                    });
                }
            }, 15000);
        });

        onUnmounted(() => {
            if (watchId.value !== null) {
                navigator.geolocation.clearWatch(watchId.value);
            }
            if (intervalId !== undefined) {
                window.clearInterval(intervalId);
            }
        });

        function handleIconClick(data: SensorDataPoint) {
            selectedData.value = data.values;
            showModal.value = true;
        }


        return { leafletMap, zoom, center, currentLocation, loading, reloadLocation, sensorData, handleIconClick, getIcon, showModal, selectedData };
    }
});
</script>

<style scoped>
#map {
    width: 100%;
    height: 100vh;
}

.button-reload {
    position: absolute;
    top: 72.5px;
    left: 10px;
    background-color: #fff;
    border: 2px solid rgba(0, 0, 0, 0.2);
    background-clip: padding-box;
    border-top: none;
    border-radius: 0 0 4px 4px;
    width: 34px;
    height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 2000;
    box-shadow: none;
    overflow: hidden;
}

.button-reload:hover {
    background-color: #f4f4f4;
}

.button-reload i {
    font-size: 18px;
    color: #333;
    line-height: 1;
}
</style>
