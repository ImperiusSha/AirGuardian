<template>
    <div class="dashboard">
        <div class="buttons">
            <div class="outer" @click="showChart('co2')">
                <div class="inner" v-bind:class="{ open: currentChart === 'co2' }">
                    <label>{{ currentChart === 'co2' ? '' : 'CO2' }}</label>
                </div>
            </div>

            <div class="outer" @click="showChart('pm')">
                <div class="inner" v-bind:class="{ open: currentChart === 'pm' }">
                    <label>{{ currentChart === 'pm' ? '' : 'PM' }}</label>
                </div>
            </div>

            <div class="outer" @click="showChart('temp')">
                <div class="inner" v-bind:class="{ open: currentChart === 'temp' }">
                    <label>{{ currentChart === 'temp' ? '' : 'TEMP' }}</label>
                </div>
            </div>
            
        </div>
        <Co2Chart v-if="currentChart === 'co2'" />
        <PmChart v-if="currentChart === 'pm'" />
        <TempChart v-if="currentChart === 'temp'" />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import Co2Chart from '../components/Co2Chart.vue';
import PmChart from '../components/PmChart.vue';

export default defineComponent({
    name: 'Dashboard',
    components: {
        Co2Chart,
        PmChart,
    },
    setup() {
        const currentChart = ref<string | null>(null);

        const showChart = (chart: string) => {
            currentChart.value = chart;
            console.log("Aktuelles Diagramm: " + currentChart.value);
        }

        return {
            currentChart,
            showChart
        }
    }
});
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    align-items: center;
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
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin: 10px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
}

.outer:hover {
    background-color: #e8e8e8;
}

.inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-align: center;
}

.inner.open {
    background-color: #ddd;
}

</style>