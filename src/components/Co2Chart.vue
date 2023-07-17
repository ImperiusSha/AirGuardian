<!-- Co2Chart.vue -->
<template>
    <div class="chart-container">
        <div class="info-container">
            <button v-if="showChart" @click="showModal = true">Wissenswertes zu den Co2-Werten</button>
            <div v-if="showModal" class="modal">
                <div class="modal-content">
                    <span class="close-button" @click="showModal = false">&times;</span>
                    <h2>Wissenswertes zu den CO2-Werten</h2>
                    <p>PPM steht für "parts per million" (Teile pro Million).
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
        </div>
        <line-chart v-if="showChart" :chart-data="datacollection" :options="chartOptions"></line-chart>
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch, computed, onMounted } from 'vue';
import { LineChart } from 'vue-chart-3';
import { Filler, Chart as ChartJS } from 'chart.js';
import { useStore } from 'vuex';

ChartJS.register(Filler);

// Benötigtes Interface, um Struktur von chartData zu repräsentieren
// Wenn nicht vorhanden, interpretiert TS Werte als "never", da es
// aus ChartData nicht die genauen Typen auslesen kann
interface LocalChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        fill: boolean;
    }[];
}

export default defineComponent({
    name: 'Co2Chart',
    components: {
        LineChart
    },
    // Verwendung des "reactive"-Werkzeug von Vue 3, um reaktive Dateneigenschaft herzustellen
    // Ermöglicht die automatische Aktualisierung des Diagrammes bei Änderungen der Werte
    // eines Objektes, da dieses reaktiv gemacht wurde
    setup() {
        console.log("Im Setup von defineComponent_Co2Chart angekommen.");
        const store = useStore();
        const showChart = ref(true);
        const maxY = ref(1000);
        const showModal = ref(false);

        const chartData = ref<LocalChartData>({
            labels: [],
            datasets: [
                {
                    label: 'CO2',
                    data: store.state.co2Values,
                    borderColor: 'rgba(115, 115, 115)',
                    backgroundColor: 'rgba(168,168,168,0.2)',
                    fill: true,
                },
            ],
        });

        const initializeChartData = (newValue: number | null) => {
            if (newValue !== null) {
                let currentTime = new Date();
                chartData.value.labels.push(currentTime.toISOString());
                chartData.value.datasets[0].data.push(newValue);

                if (newValue > maxY.value) {
                    if (newValue <= 2000) {
                        maxY.value = 2000;
                    } else {
                        maxY.value = 5000;
                    }
                }
                if (chartData.value.labels.length > 30) {
                    chartData.value.labels.shift();
                    chartData.value.datasets[0].data.shift();
                }
            }
        };

        onMounted(() => {
            const latestCo2Value = store.state.co2Values[store.state.co2Values.length - 1];
            initializeChartData(latestCo2Value);
            setInterval(() => {
                const latestCo2Value = store.state.co2Values[store.state.co2Values.length - 1];
                initializeChartData(latestCo2Value);
            }, 5000); // alle 5 Sekunde
        });


        const chartOptions = computed(() => ({
            type: 'line',
            responsive: true,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'CO2-Diagramm',
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
                        text: 'ppm'
                    },
                    min: 0,    // Setzt den Minimalwert der y-Achse
                    max: maxY.value,  // Setzt den Maximalwert der y-Achse
                    ticks: { // Legt die Schritte der y-Achse fest
                        stepSize: 100,
                    },
                    // Passt das Raster der y-Achse an um Hilfslinien hinzuzufügen
                    grid: {
                        color: function (context: { tick: { value: number; }; }) {
                            if (context.tick.value == 400) {
                                return 'rgba(150,220,0,0.4)';
                            } else if (context.tick.value == 1000) {
                                return 'rgba(220,120,0, 0.4)';
                            } else if (context.tick.value == 2000) {
                                return 'rgba(270,20,0, 0.4)';
                            }
                            return 'rgba(0,0,0,0.1)';
                        },
                        lineWidth: function (context: { tick: { value: number; }; }) {
                            if (context.tick.value == 400 || context.tick.value == 1000 || context.tick.value == 2000) {
                                return 2;
                            }
                            return 1;
                        },
                        drawBorder: false,
                        drawOnChartArea: true,
                        drawTicks: false,
                    },
                },
            },
            elements: {
                line: {
                    borderColor: 'rgba(75,192,192,0.1)', // Halbtransparente Linie
                    fill: true,
                    backgroundColor: 'rgba(75,192,192,0.2)' // Transparenz für die Flächenfüllung
                }
            }
        }));

        return {
            chartData,
            showModal,
            showChart,
            datacollection: chartData,
            chartOptions,
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
/* CSS-Code für das Modal-Fenster */
.modal {
    display: block;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0, 0, 0);
    background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
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
</style>
