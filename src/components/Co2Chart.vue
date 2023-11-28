<!-- Co2Chart.vue -->
<template>
    <div class="chart-container">
        <div class="card">
            <div class="chart-controls">
                <div class="button-container">
                    <button @click="setSelectedCO2('CO2')" v-bind:class="{ active: selectedCO2 === 'CO2' }">CO2</button>
                    <button @click="setSelectedCO2('Temp_CO2')"
                        v-bind:class="{ active: selectedCO2 === 'Temp_CO2' }">TCO2</button>
                </div>
            </div>
            <div class="chart-inner-container">
                <line-chart v-if="showChart" :chart-data="datacollection" :options="chartOptions"></line-chart>
            </div>
        </div>
        <div class="icon-bar">
            <button class="custom-icon-button" @click="showInfoModal = true">
                <i class="fas fa-info-circle custom-icon"></i>
            </button>
            <div v-if="showInfoModal" class="modal info-modal" @click.self="closeModals">
                <div class="info-modal-content" @click.stop>
                    <span class="close-button" @click="showInfoModal = false">&times;</span>
                    <h2>Wissenswertes zu den CO2-Werten</h2>
                    <p>PPM steht für <b>"parts per million"</b> (Teile pro Million).
                        Es wird verwendet, um die Konzentration von Substanzen in der Luft oder in Flüssigkeiten
                        auszudrücken.
                        Im Zusammenhang mit CO2 (Kohlendioxid) bezieht sich ppm auf die Anzahl der CO2-Moleküle pro einer
                        Million Luftmoleküle. </p>
                    <p><b>400 ppm:</b> Dies ist der Wert, den wir aktuell in der Atmosphäre sehen. Es ist das erste Mal in
                        Millionen
                        von Jahren, dass die atmosphärischen CO2-Werte so hoch sind. Vor der Industrialisierung lag dieser
                        bei
                        etwa 280 ppm.</p>
                    <p><b>1000 ppm:</b> Bei diesem Wert kann die kognitive Funktion beeinträchtigt werden.</p>
                    <p><b>2000 ppm:</b> Dieser Wert wird als Schwellenwert für schlechte Luftqualität angesehen. Symptome
                        wie
                        Kopfschmerzen, Schläfrigkeit und mangelnde Konzentration können auftreten.</p>
                </div>
            </div>
            <i @click.stop="exportData" class="fas fa-share-alt custom-icon"></i>
            <button class="custom-icon-button" @click="showSettingsModal = true">
                <i class="fas fa-cog custom-icon"></i>
            </button>
            <div v-if="showSettingsModal" class="modal-overlay" @click.self="closeModals">
                <div class="modal-content settings-modal-content" @click.stop>
                    <span class="close-button" @click="showSettingsModal = false">&times;</span>
                </div>
            </div>
        </div>
        <p class="average-value">
            <span v-if="isLoading">
                <div class="loader"></div>
            </span>
            <span v-else-if="isError">Daten nicht verfügbar</span>
            <span v-else>Durchschnittswert: {{ averageValue }}</span>
        </p>
    </div>
</template>



<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { LineChart } from 'vue-chart-3';
import { IonIcon } from '@ionic/vue';
import { shareOutline } from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { Filler, Chart as ChartJS, LineController, LineElement, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { useStore } from 'vuex';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(Filler, LineController, LineElement, PointElement, LinearScale, Title, Tooltip, ChartDataLabels, Legend);

export default defineComponent({
    name: 'CO2Chart',
    components: {
        LineChart,
        IonIcon
    },
    data() {
        return {
            isLoading: true,  // Startet im Ladezustand
            isError: false
        };
    },
    methods: {
        setSelectedCO2(type: string) {
            this.selectedCO2 = type;
        },
    },

    // Verwendung des "reactive"-Werkzeug von Vue 3, um reaktive Dateneigenschaft herzustellen
    // Ermöglicht die automatische Aktualisierung des Diagrammes bei Änderungen der Werte
    // eines Objektes, da dieses reaktiv gemacht wurde
    setup() {
        const store = useStore();
        const showChart = ref(true);
        const maxY = ref(1000);
        const showInfoModal = ref(false);
        const showSettingsModal = ref(false);
        let lastAddedValue: null = null;
        const selectedCO2 = ref('CO2');
        const chartTitle = computed(() => `${selectedCO2.value}-Diagramm`);
        const closeModals = () => {
            showInfoModal.value = false;
            showSettingsModal.value = false;
        };
        const isActive = ref(false);
        const isLoading = ref(true);
        const isError = ref(false);
        const noDataTimeout = ref<number | null>(null);

        type Dataset = {
            label: string,
            data: number[],
            borderColor: string,
            backgroundColor: string,
            fill: boolean,
        }

        const chartData = ref<{ labels: string[], datasets: Dataset[] }>({
            labels: [],
            datasets: [
                {
                    label: 'CO2',
                    data: store.state.co2Values,
                    borderColor: 'rgba(100,100,100,0.6)',
                    backgroundColor: 'rgba(75,75,75,0.2)',
                    fill: true,
                },
            ],
        });

        const initializeChartData = () => {
            // Leert die Datasets
            // chartData.value.datasets = [];

            // Wählt die Daten basierend auf dem ausgewählten CO2-Wert
            const data = selectedCO2.value === 'CO2' ? store.state.co2Values : store.state.temp_co2Values;

            // Überprüfe, ob Daten vorhanden sind
            if (data && data.length > 0) {
                isLoading.value = false;  // Beende den Ladezustand
                isError.value = false;  // Setze Fehlerzustand zurück
                if (noDataTimeout.value !== null) {
                    clearTimeout(noDataTimeout.value);
                }

                // Erstellt Labels und Werte aus den Daten
                const labels = data.map((entry: { timestamp: any; }) => entry.timestamp);
                const values = data.map((entry: { value: any; }) => entry.value);

                // Füge die Labels und Werte zum chartData hinzu
                chartData.value.labels = labels;
                chartData.value.datasets = [{
                    label: selectedCO2.value,
                    data: values,
                    borderColor: selectedCO2.value === 'CO2' ? 'rgba(80,80,80,0.5)' : 'rgba(120,120,120,0.5)',
                    backgroundColor: 'rgba(75,75,75,0.1)',
                    fill: true,
                }];

                // Die Logik zur Bestimmung des maxY-Wertes muss entsprechend angepasst werden, um das Maximum sowohl aus CO2- als auch TEMP_CO2-Werten zu bestimmen.
                const allValues = chartData.value.datasets.reduce((acc, dataset) => acc.concat(dataset.data), [] as number[]);
                const maxValue = Math.max(...allValues);

                if (maxValue <= 1000) {
                    maxY.value = 1000;
                } else if (maxValue > 1000 && maxValue <= 2000) {
                    maxY.value = 2000;
                } else if (maxValue > 2000 && maxValue <= 3000) {
                    maxY.value = 3000;
                } else if (maxValue > 3000) {
                    maxY.value = maxValue;  // Wenn der Wert 3000 übersteigt, passt sich das Diagramm entsprechend an.
                }
            }
        };

        // Berechnet den Durchschnitt der ausgewählten CO2-Werte
        const averageValue = computed(() => {
            const data = selectedCO2.value === 'CO2' ? store.state.co2Values : store.state.temp_co2Values;
            const values = data.map((entry: { value: any; }) => entry.value);
            const sum = values.reduce((a: number, b: number) => a + b, 0);
            return (sum / values.length).toFixed(2); // 2 Nachkommastellen
        });



        onMounted(() => {
            // Setze einen Timeout, um den Fehlerzustand zu setzen, wenn die Daten nicht in einer bestimmten Zeit geladen wurden
            noDataTimeout.value = window.setTimeout(() => {
                if (!store.state.isDataEverLoaded && isLoading.value) {
                    isLoading.value = false;
                    isError.value = true;
                }
            }, 60000);  // Wartezeit von 1 Minute, kann angepasst werden

            setInterval(() => {
                if (store.state.co2Values.length > 0 && store.state.co2Values[store.state.co2Values.length - 1].value !== lastAddedValue) {
                    lastAddedValue = store.state.co2Values[store.state.co2Values.length - 1].value;
                    initializeChartData();
                }
            }, 1000); // jede 10 Sekunden
        });

        watch(selectedCO2, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                initializeChartData();
            }
        }, { immediate: true });


        const chartOptions = computed(() => ({
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 50,
                }
            },
            plugins: {
                datalabels: {
                    color: '#000000',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    borderColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 4,
                    borderWidth: 1,
                    anchor: 'start',
                    align: 'top',
                    offset: 10,
                    formatter: (value: any, ctx: { dataset: { data: { [x: string]: any; }; }; dataIndex: string | number; }) => {
                        const val = ctx.dataset.data[ctx.dataIndex];
                        // Prüfen Sie, ob der Wert null oder undefined ist und geben Sie in diesem Fall null zurück
                        return (val !== null && val !== undefined) ? val : null;
                    },


                },
                legend: {
                    display: false,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy',
                    },
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear',
                        from: 1,
                        to: 0,
                        loop: true
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    type: 'time',
                    time: {
                        display: true,
                        unit: 'second',
                        displayFormats: {
                            second: 'HH:mm'
                        }
                    },
                    ticks: {
                        beginAtZero: true,
                        source: 'data'
                    },
                    title: {
                        display: true,
                        text: 'Zeitangabe',
                        font: {
                            size: 16,
                            weight: 500
                        },

                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'ppm',
                        font: {
                            size: 16,
                            weight: 500
                        },
                        padding: { bottom: -5 }
                    },
                    min: 0,
                    max: maxY.value,
                    ticks: {
                        stepSize: 100,
                    },
                    // Passt das Raster der y-Achse an um Hilfslinien hinzuzufügen
                    grid: {
                        color: function (context: { tick: { value: number; }; }) {
                            if (context.tick.value == 400) {
                                return 'rgba(150,220,0, 0.4)';
                            } else if (context.tick.value == 1000) {
                                return 'rgba(220,120,0, 0.4)';
                            } else if (context.tick.value == 2000) {
                                return 'rgba(255,20,0, 0.4)';
                            } else if (context.tick.value == 3000) {
                                return 'rgba(120,10,10, 0.8)';
                            }
                            return 'rgba(0,0,0,0.1)';
                        },
                        lineWidth: function (context: { tick: { value: number; }; }) {
                            if (context.tick.value == 400 || context.tick.value == 1000 || context.tick.value == 2000 || context.tick.value == 5000) {
                                return 2;
                            }
                            return 1;
                        },
                        drawBorder: true,
                        drawOnChartArea: true,
                        drawTicks: false,
                    },
                },
            },
        }));

        const reactiveChartOptions = computed(() => chartOptions);

        const exportData = async function () {
            const data = chartData.value.datasets[0].data;
            const labels = chartData.value.labels;

            const dataAsString = labels.map((label, i) => `${label},${data[i]}`).join("\n");
            const fileContent = `Timestamp,Value\n${dataAsString}`;

            // Pfad zur Datei festlegen (im Cache-Verzeichnis)
            const filePath = 'exportedData.csv';

            try {
                // Schreiben der Daten in eine Datei
                await Filesystem.writeFile({
                    path: filePath,
                    data: fileContent,
                    directory: Directory.Cache, // Android Limitierung, daher Verweisung auf Cache-Verzeichnis
                    encoding: Encoding.UTF8
                });

                // Tatsächliche URI der Datei
                const fileUri = await Filesystem.getUri({
                    path: filePath,
                    directory: Directory.Cache
                });

                // Teilen der Datei
                await Share.share({
                    title: 'Exported Data',
                    text: 'Here is the exported data from AirGuardian',
                    url: fileUri.uri,
                    dialogTitle: 'Share CSV data'
                });

                alert('Daten erfolgreich exportiert!');
            } catch (e) {
                console.error("Unable to write file", e);
            }
        }


        return {
            chartData,
            showInfoModal,
            showSettingsModal,
            showChart,
            selectedCO2,
            averageValue,
            chartTitle,
            closeModals,
            datacollection: chartData,
            chartOptions,
            initializeChartData,
            exportData,
            shareOutline,
            isActive,
            isLoading,
            isError,
            reactiveChartOptions
        };
    }
})
</script>

<style scoped> @keyframes rotate {
     100% {
         transform: rotate(360deg);
     }
 }

 /* Responsives Design */
 @media (max-width: 768px) {
     .card {
         padding: 0.5rem;
     }

 }

 .average-value {
     display: flex;
     align-items: center;
     justify-content: center;
     width: 100%;
     height: 8%;
     background-color: #fefefe;
     border: 1px solid rgba(58, 209, 141, 0.9);
     border-radius: 5px;
     color: rgb(83, 140, 204);
     bottom: -2%;
     padding: 10px;
     position: absolute;
     margin-top: 20px;
     font-size: 24px;
     font-weight: bold;
     box-shadow: 0px 0px 8px #a2a2a2;
     z-index: 100;
 }

 .loader {
     border: 8px solid #f3f3f3;
     border-top: 8px solid rgb(83, 140, 204);
     border-radius: 50%;
     width: 50px;
     height: 50px;
     scale: 0.7;
     animation: rotate 2s linear infinite;
 }

 .average-value span {
     display: inline-block;
 }

 .average-value span:after {
     content: '\2022';
     display: inline-block;
     margin-left: 10px;
     animation: spin 1s linear infinite;
 }

 .average-value:not(.isLoading) span:after {
     display: none;
 }

 .info-modal {
     background-color: rgba(0, 0, 0, 0.4);
 }

 .info-modal-content {
     background-color: #fefefe;
     margin: 15% auto;
     padding: 20px;
     border: 1px solid #888;
     width: 90%;
 }

 .modal {
     display: block;
     position: fixed;
     z-index: 1;
     left: 0;
     top: 0;
     width: 100%;
     height: 100%;
     overflow: auto;
     background-color: rgba(0, 0, 0, 0.654);
     justify-content: center;
     align-items: center;
 }

 .close-button {
     color: #aaaaaa;
     float: right;
     font-size: 28px;
     font-weight: bold;
 }

 .close-button:hover,
 .close-button:focus {
     color: #000;
     text-decoration: none;
     cursor: pointer;
 }

 .card {
     background: #ffffff;
     box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.1);
     border-radius: 8px;
     padding: 1rem;
     width: 100%;
     height: auto;
 }

 .button-container {
     display: flex;
     justify-content: center;
     margin-bottom: 10px;
 }

 .button-container button {
     background-color: #fefefe;
     border: 1px solid rgb(218, 216, 216);
     border-radius: 5px;
     padding: 10px;
     margin: 0 5px;
     color: #7a7a7a;
     transition: all 0.3s ease-in-out;
     cursor: pointer;
     outline: none;
 }

 .button-container button.active:before,
 .button-container button.active:after {
     content: '';
     position: absolute;
     left: 0;
     height: 2px;
     width: 100%;
     background-color: rgba(58, 209, 141, 0.9);
 }

 .button-container button.active:before {
     top: 0;
 }

 .button-container button.active:after {
     bottom: 0;
 }

 .button-container button {
     position: relative;
     overflow: hidden;
 }

 .button-container button:not(.active) {
     opacity: 50%;
 }

 .icon-bar {
     display: flex;
     justify-content: space-between;
     width: 100%;
     margin-top: 50px;
 }

 .custom-icon {
     margin: 0 20px;
     font-size: 30px;
     color: #7a7a7a;
     border: 2px solid rgb(83, 140, 204);
     border-radius: 50%;
     padding: 15px;
     background-color: transparent;
     box-shadow: 0px 0px 4px #a2a2a2;
     opacity: 80%;
 }

 .custom-icon-button {
     background: none;
     border: none;
     cursor: pointer;
 }

 .custom-icon:hover {
     color: #333;
     border-color: #333;
 }

 .modal-overlay {
     position: fixed;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background-color: rgba(0, 0, 0, 0.5);
     display: flex;
     justify-content: center;
     align-items: center;
 }

 .settings-modal-content {
     background: white;
     padding: 20px;
     border-radius: 5px;
 }

 .chart-inner-container {
     width: 100%;
     height: auto;
     margin: auto;
 }
</style>