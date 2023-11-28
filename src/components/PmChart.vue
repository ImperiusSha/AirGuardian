<!-- PMChart.vue -->
<template>
    <div class="chart-container">
        <div class="card">
            <div class="chart-controls">
                <div class="button-container">
                    <button @click="setSelectedPM('PM10')" v-bind:class="{ active: selectedPM === 'PM10' }">PM10</button>
                    <button @click="setSelectedPM('PM2.5')" v-bind:class="{ active: selectedPM === 'PM2.5' }">PM2.5</button>
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
                    <h2>Wissenswertes zu den PM-Werten</h2>
                    <p>PM steht für <b>Particulate Matter</b> und bezieht sich auf atmosphärische Partikel,
                        die in die Luft emittiert werden und klein genug sind, um eingeatmet zu werden.
                        Diese Partikel sind in der Regel das Ergebnis von Verbrennungsprozessen oder können sich aus
                        natürlichen Quellen wie Staub oder Pollen bilden.</p>
                    <p>
                        <r>PM2.5</r> sind feine Partikel mit einem Durchmesser von weniger als 2,5 Mikrometern. Wegen ihrer
                        geringen
                        Größe können sie tiefer in die Lungen eindringen und sogar in den Blutkreislauf gelangen. Sie sind
                        in der Regel das Produkt von Verbrennungsprozessen, einschließlich Kraftfahrzeugen, Kraftwerken und
                        Waldbränden. Sie können auch aus chemischen Reaktionen in der Atmosphäre entstehen.
                    </p>
                    <p>
                        <r>PM10</r> sind Partikel, die kleiner als 10 Mikrometer im Durchmesser sind. Sie umfassen
                        PM2.5-Partikel sowie größere Partikel, die ebenfalls eingeatmet werden können, aber nicht so tief in
                        die Lunge eindringen. PM10 kann aus vielen der gleichen Quellen wie PM2.5 stammen, aber auch aus
                        mechanischen Prozessen wie dem Zerkleinern oder Mahlen und aus natürlichen Quellen wie Staub oder
                        Pollen.
                    </p>
                    <p><b>Gesundheitsrisiko:</b> In Bezug auf die gesundheitlichen Auswirkungen sind beide Arten von
                        Partikeln bedenklich, aber PM2.5 kann wegen ihrer Fähigkeit, tiefer in die Lunge und in den
                        Blutkreislauf einzudringen, besonders problematisch sein. Sie sind mit einer Reihe von
                        Gesundheitsproblemen verbunden, einschließlich Atemwegs- und Herz-Kreislauf-Erkrankungen und
                        vorzeitigem Tod.
                    <p>Die Weltgesundheitsorganisation (WHO) hat Richtlinien für akzeptable Konzentrationen von PM2.5 und
                        PM10 in der Luft vorgeschlagen:</p>
                    <p>Für PM2.5: 10 μg/m³ als Jahresmittelwert und 25 μg/m³ als 24-Stunden-Mittelwert.</p>
                    <p>Für PM10: 20 μg/m³ als Jahresmittelwert und 50 μg/m³ als 24-Stunden-Mittelwert</p>
                    </p>
                    <br>
                    <p><b>Im Allgemeinen gelten folgende Richtwerte:</b></p>
                    <p><b>0-50 µg/m³ (Gut):</b> Bei diesem Niveau gilt die Luftqualität im Allgemeinen als
                        zufriedenstellend und die Luftverschmutzung stellt wenig oder kein Risiko dar.</p>
                    <p><b>50-100 µg/m³ (Mäßig):</b> Dieses Niveau kann bei empfindlichen Personen zu
                        gesundheitlichen Auswirkungen führen. Die allgemeine Öffentlichkeit ist wahrscheinlich nicht
                        betroffen.</p>
                    <p><b>100-200 µg/m³ (Schlecht für empfindliche Gruppen):</b> Es besteht eine zunehmende
                        Wahrscheinlichkeit von Auswirkungen auf empfindliche Personen und eine geringe Wahrscheinlichkeit
                        von Auswirkungen auf die allgemeine Öffentlichkeit.</p>
                    <p><b>200-350 µg/m³ (Schlecht):</b>Jeder kann Auswirkungen erfahren. Es besteht eine größere
                        Wahrscheinlichkeit, dass bei empfindlichen Personen ernsthafte gesundheitliche Auswirkungen
                        auftreten.</p>
                    <p><b>350+ µg/m³ (Sehr schlecht):</b>Gesundheitswarnungen werden ausgesprochen. Die gesamte Bevölkerung
                        ist wahrscheinlich betroffen.</p>
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
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
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
    name: 'PMChart',
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
        setSelectedPM(type: string) {
            this.selectedPM = type;
        },
    },
    // Verwendung des "reactive"-Werkzeug von Vue 3, um reaktive Dateneigenschaft herzustellen
    // Ermöglicht die automatische Aktualisierung des Diagrammes bei Änderungen der Werte
    // eines Objektes, da dieses reaktiv gemacht wurde
    setup() {
        console.log("Im Setup von defineComponent_PMChart angekommen.");
        const store = useStore();
        const showChart = ref(true);
        const maxY = ref(50);
        const showInfoModal = ref(false);
        const showSettingsModal = ref(false);
        let lastAddedValue: null = null;
        const selectedPM = ref('PM10');
        const chartTitle = computed(() => `${selectedPM.value}-Diagramm`);
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
                    label: 'PM10',
                    data: store.state.pm10Values,
                    borderColor: 'rgba(100,100,100,0.6)',
                    backgroundColor: 'rgba(75,75,75,0.2)',
                    fill: true,
                },
            ],
        });


        const initializeChartData = () => {
            // Leert die Datasets
            chartData.value.datasets = [];

            // Wählt die Daten basierend auf dem ausgewählten PM-Wert
            const data = selectedPM.value === 'PM10' ? store.state.pm10Values : store.state.pm25Values;

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
                    label: selectedPM.value,
                    data: values,
                    borderColor: selectedPM.value === 'PM10' ? 'rgba(80,80,80,0.5)' : 'rgba(120,120,120,0.5)',
                    backgroundColor: 'rgba(75,75,75,0.1)',
                    fill: true,
                }];

                // Die Logik zur Bestimmung des maxY-Wertes muss entsprechend angepasst werden, um das Maximum sowohl aus PM10- als auch PM2.5-Werten zu bestimmen.
                const allValues = chartData.value.datasets.reduce((acc, dataset) => acc.concat(dataset.data), [] as number[]);
                const maxValue = Math.max(...allValues);

                if (maxValue <= 50) {
                    maxY.value = 50;
                } else if (maxValue > 50 && maxValue <= 100) {
                    maxY.value = 100;
                } else if (maxValue > 100 && maxValue <= 200) {
                    maxY.value = 200;
                } else if (maxValue > 200 && maxValue <= 350) {
                    maxY.value = 350;
                } else if (maxValue > 350) {
                    maxY.value = maxValue;  // Wenn der Wert 350 übersteigt, passt sich das Diagramm entsprechend an.
                }
            }
        };

        // Berechnet den Durchschnitt der ausgewählten PM-Werte
        const averageValue = computed(() => {
            const data = selectedPM.value === 'PM10' ? store.state.pm10Values : store.state.pm25Values;
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
                if (store.state.pm10Values.length > 0 && store.state.pm10Values[store.state.pm10Values.length - 1].value !== lastAddedValue) {
                    lastAddedValue = store.state.pm10Values[store.state.pm10Values.length - 1].value;
                    initializeChartData();
                }
            }, 10); // jede 10 Sekunden
        });


        watch(selectedPM, (newVal, oldVal) => {
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
                        return ctx.dataset.data[ctx.dataIndex];
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
                        }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'µg/m³',
                        font: {
                            size: 16,
                            weight: 500
                        }
                    },
                    min: 0,    // Setzt den Minimalwert der y-Achse
                    max: maxY.value,  // Setzt den Maximalwert der y-Achse
                    ticks: { // Legt die Schritte der y-Achse fest
                        stepSize: 10,
                    },
                    // Passt das Raster der y-Achse an um Hilfslinien hinzuzufügen
                    grid: {
                        color: function (context: { tick: { value: number; }; }) {
                            if (context.tick.value == 50) {
                                return 'rgba(150,220,0, 0.4)';
                            } else if (context.tick.value == 100) {
                                return 'rgba(220,120,0, 0.4)';
                            } else if (context.tick.value == 200) {
                                return 'rgba(255,20,0, 0.4)';
                            } else if (context.tick.value == 350) {
                                return 'rgba(120,10,10, 0.8)';
                            }
                            return 'rgba(0,0,0,0.1)';
                        },
                        lineWidth: function (context: { tick: { value: number; }; }) {
                            if (context.tick.value == 50 || context.tick.value == 100 || context.tick.value == 200 || context.tick.value == 350) {
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
            selectedPM,
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
            isError
        };
    }
})
</script>

<style>
.chart-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: calc(100vh - 60px);
    overflow-y: auto;
    width: 100%;
    height: auto;
}

.chart-controls button {
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 10px;
    margin: 0 5px;
    flex-direction: column;
    cursor: pointer;
    outline: none;
}

.chart-controls button:hover {
    background-color: #e9e9e9;
}

.buttons-container {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
}

.info-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    gap: 10px;
    padding: 1rem;
}

.modal-button {
    order: 1;
}

.outer {
    position: relative;
    order: 2;
    width: 30px;
    height: 30px;
    cursor: pointer;
    overflow: hidden;
}

.inner {
    width: inherit;
    height: inherit;
    text-align: center;
    line-height: 30px;
}

.inner:before,
.inner:after {
    position: absolute;
    content: '';
    height: 1px;
    width: inherit;
    left: 0;
    transition: all .3s ease-in;
}

.inner:before {
    top: 0;
    transform: rotate(0);
}

.inner:after {
    bottom: 0;
    transform: rotate(0);
}

.inner.open:before {
    top: 50%;
    left: 49%;
    background: rgba(58, 209, 141, 0.9);
    transform: rotate(90deg);
}

.inner.open:after {
    bottom: 50%;
    left: -49%;
    background: rgba(58, 209, 141, 0.9);
    transform: rotate(-90deg);
}

.outer:has(.inner.open) {
    background-color: #fefefe;
    scale: 1.5;
    opacity: 100%;
    box-shadow: 0px 1px 2px #a2a2a2;
}

.inner.open .label {
    color: rgb(83, 140, 204);
}
</style>
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

