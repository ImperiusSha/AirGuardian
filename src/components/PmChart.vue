<!-- PM10Chart.vue -->
<template>
    <div class="chart-container">
        <div class="info-container">
            <button class="pm-button" @click="showInfoModal = true">Wissenswertes zu den PM-Werten</button>
            <button class="modal-button settings-button" @click="showSettingsModal = true">
                <i class="fas fa-cog"></i>
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

            <div v-if="showSettingsModal" class="modal settings-modal" @click.self="closeModals">
                <div class="settings-modal-content" @click.stop>
                    <span class="close-button" @click="showSettingsModal = false">&times;</span>
                    <div>
                        <input type="radio" id="pm10" value="PM10" v-model="selectedPM">
                        <label for="pm10">PM10</label>
                    </div>
                    <div>
                        <input type="radio" id="pm25" value="PM2.5" v-model="selectedPM">
                        <label for="pm25">PM2.5</label>
                    </div>
                </div>
            </div>
            <ion-icon @click.stop="exportData" :icon='shareOutline'></ion-icon>
        </div>
        <line-chart v-if="showChart" :chart-data="datacollection" :options="chartOptions"></line-chart>
        <p class="average-value">Durchschnittswert: {{ averageValue }}</p>

    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'; // Import Capacitor Filesystem
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
            // Leere die Datasets
            chartData.value.datasets = [];

            // Wähle die Daten basierend auf dem ausgewählten PM-Wert
            const data = selectedPM.value === 'PM10' ? store.state.pm10Values : store.state.pm25Values;

            // Erstelle Labels und Werte aus den Daten
            const labels = data.map((entry: { timestamp: any; }) => entry.timestamp);
            const values = data.map((entry: { value: any; }) => entry.value);

            // Füge die Labels und Werte zum chartData hinzu
            chartData.value.labels = labels;
            chartData.value.datasets.push({
                label: selectedPM.value,
                data: values,
                borderColor: selectedPM.value === 'PM10' ? 'rgba(100,100,100,0.6)' : 'rgba(50,150,50,0.6)',
                backgroundColor: 'rgba(75,75,75,0.2)',
                fill: true,
            });

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
        };

        // Berechne den Durchschnitt der ausgewählten PM-Werte
        const averageValue = computed(() => {
            const data = selectedPM.value === 'PM10' ? store.state.pm10Values : store.state.pm25Values;
            const values = data.map((entry: { value: any; }) => entry.value);
            const sum = values.reduce((a: number, b: number) => a + b, 0);
            return (sum / values.length).toFixed(2); // 2 Nachkommastellen
        });

        onMounted(() => {
            setInterval(() => {
                if (store.state.pm10Values.length > 0 && store.state.pm10Values[store.state.pm10Values.length - 1].value !== lastAddedValue) {
                    lastAddedValue = store.state.pm10Values[store.state.pm10Values.length - 1].value;
                    initializeChartData();
                }
            }, 10); // jede Sekunde
        });

        watch(selectedPM, () => {
            initializeChartData();
        });

        const chartOptions = computed(() => ({
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: chartTitle.value,
                },
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
                    display: true,
                    position: 'top',
                },
            },
            scales: {
                x: {
                    display: true,
                    type: 'time',
                    time: {
                        display: true,
                        unit: 'second',
                        displayFormats: {
                            second: 'HH:mm:ss'
                        }
                    },
                    ticks: {
                        beginAtZero: true,
                        source: 'data'
                    },
                    title: {
                        display: true,
                        text: 'Zeitangabe'
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'µg/m³'
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
                // Schreiben Sie die Daten in die Datei
                await Filesystem.writeFile({
                    path: filePath,
                    data: fileContent,
                    directory: Directory.Cache, // Verwenden Sie das Cache-Verzeichnis
                    encoding: Encoding.UTF8
                });

                // Holen Sie sich die tatsächliche URI der Datei
                const fileUri = await Filesystem.getUri({
                    path: filePath,
                    directory: Directory.Cache
                });

                // Teilen Sie die Datei
                await Share.share({
                    title: 'Exported Data',
                    text: 'Here is the exported data from AirGuardian',
                    url: fileUri.uri, // Verwenden Sie die tatsächliche URI
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
            shareOutline
        };
    }
})
</script>

<style>
/* CSS-Code für den Button */
.chart-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.info-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    gap: 10px;
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
}

.inner {
    width: inherit;
    height: inherit;
    text-align: center;
    line-height: 30px;
}

label {
    font-size: .8em;
    text-transform: uppercase;
    color: grey;
    transition: all .3s ease-in;
    opacity: 1;
    cursor: pointer;
}

.inner:before,
.inner:after {
    position: absolute;
    content: '';
    height: 1px;
    width: inherit;
    background: #5c5e5d;
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

.inner.open label {
    opacity: 1;
}

.inner.open:before {
    top: 50%;
    transform: rotate(45deg);
}

.inner.open:after {
    bottom: 50%;
    transform: rotate(-45deg);

}
</style>

<style scoped>
.average-value {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    background-color: #eee;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    margin-top: 20px;
    font-size: 18px;
    font-weight: bold;
    color: #333;
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

.settings-modal {
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
}

.settings-modal-content {
    background-color: #fefefe;
    margin: 25% auto;
    padding: 10px;
    border: 1px solid #888;
    width: 50%;
    display: inline-flexbox;
    max-width: 500px;
}

.modal-button {
    border: none;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    transition-duration: 0.4s;
    cursor: pointer;
    background-color: white;
    color: black;
}

.pm-button:hover,
.modal-button:hover {
    background-color: #555555;
    color: white;
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

input[type=checkbox] {
    margin-right: 10px;
}

label {
    font-size: 1em;
    color: grey;
    cursor: pointer;
}
</style>

