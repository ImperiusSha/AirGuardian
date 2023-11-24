<template>
    <div class="dashboard" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
        <div class="buttons">
            <div class="outer" @click="showChart('co2')">
                <div class="inner" v-bind:class="{ open: currentChart === 'co2' }">
                    <label class="label">CO2</label>
                </div>
            </div>

            <div class="outer" @click="showChart('pm')">
                <div class="inner" v-bind:class="{ open: currentChart === 'pm' }">
                    <label class="label">PM</label>
                </div>
            </div>

            <div class="outer" @click="showChart('atmo')">
                <div class="inner" v-bind:class="{ open: currentChart === 'atmo' }">
                    <label class="label_atmo">ATMO</label>
                </div>
            </div>

        </div>
        <Co2Chart v-if="currentChart === 'co2'" />
        <PmChart v-if="currentChart === 'pm'" />
        <AtmoChart v-if="currentChart === 'atmo'" />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Co2Chart from '../components/Co2Chart.vue';
import PmChart from '../components/PmChart.vue';
import AtmoChart from '../components/AtmoChart.vue';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'Dashboard',
    components: {
        Co2Chart,
        PmChart,
        AtmoChart
    },
    setup() {
        const savedChart = window.localStorage.getItem('selectedChart');
        const currentChart = ref<string | null>(savedChart || 'co2');
        const router = useRouter();
        const touchStartX = ref(0);
        const touchEndX = ref(0);

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.value = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX.value = e.changedTouches[0].clientX;
            handleSwipeGesture();
        };

        const handleSwipeGesture = () => {
            const minSwipeDistance = 30; 
            if (touchStartX.value - touchEndX.value > minSwipeDistance) {
                router.push({ name: 'Homepage' });
            }
        };

        const showChart = (chart: string) => {
            currentChart.value = chart;
            window.localStorage.setItem('selectedChart', chart);
            console.log("Aktuelles Diagramm: " + currentChart.value);
        }

        return {
            currentChart,
            showChart,
            handleTouchStart,
            handleTouchEnd
        }
    }
});
</script>

<style scoped>
.dashboard {
    flex-direction: column;
    align-items: center;
    height: auto;
}

.buttons {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 20px 0;
}

.outer {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fefefe;
    border: 1px solid rgb(218, 216, 216);
    border-radius: 5px;
    margin: 10px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    opacity: 50%;
}

.inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-align: center;
}
.label {
    font-size: .7em;
    text-transform: uppercase;
    color: #7a7a7a;
    transition: all .3s ease-in;
    opacity: 1;
    cursor: pointer;
}

.label_atmo {
    font-size: .5em;
    text-transform: uppercase;
    color: #7a7a7a;
    transition: all .3s ease-in;
    opacity: 1;
    cursor: pointer;
}
</style>