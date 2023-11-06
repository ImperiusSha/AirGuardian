<template>
    <l-map v-if="!loading" ref="leafletMap" id="map" style="width: 100%; height: 100vh" :zoom="zoom" :center="center">
        <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            :attribution="'&copy; <a href=https://www.openstreetmap.org/copyright>OpenStreetMap</a> contributors'"></l-tile-layer>
        <l-marker v-if="currentLocation" :lat-lng="currentLocation"></l-marker>
        <l-marker v-for="data in sensorData" :key="data.id" :lat-lng="data.location" :icon="getIcon(data)"
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
import { defineComponent, ref, onMounted } from 'vue';
import 'leaflet';
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import * as L from 'leaflet';
import { useGPS } from "../composables/useGPS";
import store from '@/store';
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
        const selectedData = ref({ co2: 0, pm10: 0, pm25: 0, temp: 0 });

        const defaultIcon = L.icon({
            iconUrl: '/images/default_flag.png', 
            iconSize: [20, 20], 
            iconAnchor: [10, 41], 
            popupAnchor: [-1, -34] 
        });


        function getIcon(data: { co2: number; }) {
            let iconUrl = '/images/green_flag.png';;
            if (data.co2 <= 400) {
                iconUrl = '/images/green_flag.png'; 
            } else if (data.co2 > 400 && data.co2 <= 1000) {
                iconUrl = '/images/yellow_flag.png';
            } else if (data.co2 > 1000 && data.co2 <= 2000) {
                iconUrl = '/images/red_flag.png';
            } else {
                iconUrl = '/images/dark_red_flag.png';
            }

            return L.icon({
                ...defaultIcon.options,
                iconUrl: iconUrl
            });
        }


        const reloadLocation = async () => {
            loading.value = true; 
            try {
                const { getCurrentPosition } = useGPS();
                const position: GeolocationPosition = await getCurrentPosition() as GeolocationPosition;
                center.value = [position.coords.latitude, position.coords.longitude];
                currentLocation.value = center.value;

                const key = `${currentLocation.value[0]}-${currentLocation.value[1]}`;
                if (!addedCoordinates.value.has(key)) {
                    const data = {
                        location: currentLocation.value,
                        co2: store.state.co2Values,
                        pm10: store.state.pm10Values,
                        pm25: store.state.pm25Values,
                        temp: store.state.tempValues,
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
        });

        function handleIconClick(data: any) {
            selectedData.value = data;
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
