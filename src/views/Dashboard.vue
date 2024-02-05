<template>
    <div class="page-container">
        <div class="dashboard" @touchstart="handleTouchStart" @touchend="handleTouchEnd" @mousedown="handleMouseDown"
            @mouseup="handleMouseUp">
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
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import Co2Chart from '../components/Co2Chart.vue';
import PmChart from '../components/PmChart.vue';
import AtmoChart from '../components/AtmoChart.vue';
import { useRouter } from 'vue-router';
import Shepherd from 'shepherd.js';
import store from '@/store';

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
        const isMouseDown = ref(false);
        const mouseXStart = ref(0);
        const mouseXEnd = ref(0);
        const tour = ref<Shepherd.Tour | null>(null);

        onMounted(() => {
            console.log(store.state.currentTutorialStep);
            if (store.state.currentTutorialStep === 'dashboard') {
                initializeDashboardTutorial();
            }
        });

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.value = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX.value = e.changedTouches[0].clientX;
            handleSwipeGesture();
        };

        const handleMouseDown = (e: MouseEvent) => {
            isMouseDown.value = true;
            mouseXStart.value = e.clientX;
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isMouseDown.value) return;
            isMouseDown.value = false;
            mouseXEnd.value = e.clientX;
            handleSwipeGesture(true); // true für Maus-Event
        };

        const handleSwipeGesture = (isMouseEvent = false) => {
            const minSwipeDistance = 30;
            const start = isMouseEvent ? mouseXStart.value : touchStartX.value;
            const end = isMouseEvent ? mouseXEnd.value : touchEndX.value;
            if (start - end > minSwipeDistance) {
                router.push({ name: 'Homepage' });
            }
        };

        const showChart = (chart: string) => {
            currentChart.value = chart;
            window.localStorage.setItem('selectedChart', chart);
            console.log("Aktuelles Diagramm: " + currentChart.value);
        }

        function initializeDashboardTutorial() {
            tour.value = new Shepherd.Tour({
                useModalOverlay: true,
                defaultStepOptions: {
                    classes: 'shadow-md bg-purple-dark',
                    scrollTo: true
                }
            });

            // Schritt 1: Auswahl der Kategorie
            tour.value.addStep({
                id: 'buttons',
                classes: 'custom-shepherd-step',
                text: `Diese Schaltfläche ermöglich es, zwischen den verschiedenen Kategorien zu wechseln.`,
                attachTo: { element: '.buttons', on: 'bottom' },
                buttons: [
                    {
                        text: 'Weiter 1/7',
                        action: () => {
                            if (tour.value) {
                                tour.value.next();
                                store.commit('SET_CURRENT_TUTORIAL_STEP', 'CO2');
                            }
                        }
                    }
                ],
            });
            if (tour.value) {
                tour.value.start();
            } else {
                console.log('Tour wurde nicht initialisiert');
            }
        };

        watch(() => store.state.currentTutorialStep, (newStep) => {
            if (newStep === 'dashboard' && !store.state.tutorialCompleted) {
                initializeDashboardTutorial();
                if (tour.value) {
                    tour.value.start();
                }
            }
        });

        return {
            currentChart,
            showChart,
            handleTouchStart,
            handleTouchEnd,
            handleMouseDown,
            handleMouseUp
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
    padding: 20px 20px;
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

.page-container {
    max-height: 75vh;
    overflow-y: auto;
}
</style>