<!-- AtmoChart.vue -->
<template>
    <div class="chart-container">
        <div class="card">
            <div class="chart-controls">
                <div class="button-container">
                    <button @click="selectedAtmo = 'TEMP';" v-bind:class="{ active: selectedAtmo === 'TEMP' }">
                        TEMP
                    </button>
                    <button @click="selectedAtmo = 'PRESS';" v-bind:class="{ active: selectedAtmo === 'PRESS' }">
                        PRESS
                    </button>
                    <button @click="selectedAtmo = 'HUMID';" v-bind:class="{ active: selectedAtmo === 'HUMID' }">
                        HUMID
                    </button>
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
                    <h2>{{ getAtmoDescription(selectedAtmo).title }}</h2>
                    <div v-for="(paragraph, index) in getAtmoDescription(selectedAtmo).content" :key="index">
                        <p>{{ paragraph }}</p>
                    </div>
                </div>
            </div>
            <button class="custom-icon-button" @click="showSettingsModal = true">
                <i class="fas fa-chart-line custom-icon"></i>
            </button>
            <div v-if="showSettingsModal" class="modal info-modal" @click.self="closeModals">
                <div class="info-modal-content" @click.stop>
                    <span class="close-button" @click="showSettingsModal = false">&times;</span>
                    <h2>{{ getAtmoImprovements(selectedAtmo).title }}</h2>
                    <div v-for="(section, sectionIndex) in getAtmoImprovements(selectedAtmo).sections"
                        :key="`section-${sectionIndex}`">
                        <h3>{{ section.heading }}</h3>
                        <div v-for="(item, itemIndex) in section.items" :key="`item-${itemIndex}`">
                            <p><b>{{ item.title }}:</b> {{ item.description }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <i @click.stop="exportData" class="fas fa-share-alt custom-icon"></i>
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
import Annotation from 'chartjs-plugin-annotation';

ChartJS.register(Filler, LineController, LineElement, PointElement, LinearScale, Title, Tooltip, ChartDataLabels, Legend, Annotation);


export default defineComponent({
    name: 'TempChart',
    components: {
        LineChart,
        IonIcon
    },
    data() {
        return {
            isLoading: true,
            isError: false
        };
    },
    // Verwendung des "reactive"-Werkzeug von Vue 3, um reaktive Dateneigenschaft herzustellen
    // Ermöglicht die automatische Aktualisierung des Diagrammes bei Änderungen der Werte
    // eines Objektes, da dieses reaktiv gemacht wurde
    setup() {
        const store = useStore();
        const showChart = ref(true);
        const showInfoModal = ref(false);
        const showSettingsModal = ref(false);
        let lastAddedValue: null = null;
        type AtmoType = 'TEMP' | 'HUMID' | 'PRESS';
        const selectedAtmo = ref<AtmoType>('TEMP');
        const chartTitle = computed(() => `${selectedAtmo.value}-Diagramm`);
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
                    label: 'TEMP',
                    data: store.state.tempValues,
                    borderColor: 'rgba(100,100,100,0.6)',
                    backgroundColor: 'rgba(75,75,75,0.2)',
                    fill: false,
                },
            ],
        });

        const initializeChartData = () => {
            // Leert die Datasets
            chartData.value.datasets = [];

            let data;
            switch (selectedAtmo.value) {
                case 'TEMP':
                    data = store.state.tempValues;
                    break;
                case 'PRESS':
                    data = store.state.pressValues;
                    break;
                case 'HUMID':
                    data = store.state.humidValues;
                    break;
                default:
                    data = [];
                    break;
            }

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

                // Setzt "fill" basierend auf dem ausgewählten Atmo-Typ
                const fill = selectedAtmo.value !== 'TEMP';

                // Fügt die Labels und Werte zum chartData hinzu
                chartData.value.labels = labels;
                chartData.value.datasets = [{
                    label: selectedAtmo.value,
                    data: values,
                    borderColor: selectedAtmo.value === 'TEMP' ? 'rgba(80,80,80,0.5)' : 'rgba(120,120,120,0.5)',
                    backgroundColor: 'rgba(75,75,75,0.1)',
                    fill: fill,
                }];
            }
        };

        // Berechnet den Durchschnitt des ausgewählten Wertes
        const averageValue = computed(() => {
            let data;
            switch (selectedAtmo.value) {
                case 'TEMP':
                    data = store.state.tempValues;
                    break;
                case 'PRESS':
                    data = store.state.pressValues;
                    break;
                case 'HUMID':
                    data = store.state.humidValues;
                    break;
                default:
                    data = [];
                    break;
            }
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
                // Extrahiere die neuesten Werte für jeden Typ
                const lastTempValue = store.state.tempValues.length > 0 ? store.state.tempValues[store.state.tempValues.length - 1].value : null;
                const lastHumidValue = store.state.humidValues.length > 0 ? store.state.humidValues[store.state.humidValues.length - 1].value : null;
                const lastPressValue = store.state.pressValues.length > 0 ? store.state.pressValues[store.state.pressValues.length - 1].value : null;

                // Prüft, ob neue Daten für den aktuell ausgewählten Typ hinzugefügt wurden, bevor das Diagramm aktualisiert wird
                let lastValue;
                switch (selectedAtmo.value) {
                    case 'TEMP':
                        lastValue = lastTempValue;
                        break;
                    case 'HUMID':
                        lastValue = lastHumidValue;
                        break;
                    case 'PRESS':
                        lastValue = lastPressValue;
                        break;
                    default:
                        lastValue = null;
                        break;
                }

                if (lastValue !== null && lastValue !== lastAddedValue) {
                    lastAddedValue = lastValue;
                    initializeChartData();
                }
            }, 10000); // jede 10 Sekunden
        });




        // Funktion zur Bestimmung des Titels der Y-Achse
        function getYAxisTitle(atmoType: string) {
            switch (atmoType) {
                case 'TEMP':
                    return 'Temperatur (°C)';
                case 'PRESS':
                    return 'Druck (hPa)';
                case 'HUMID':
                    return 'Luftfeuchtigkeit (%)';
                default:
                    return '';
            }
        }

        // Funktion zur Bestimmung der Y-Achsen-Einstellungen
        function getYAxisSettings(atmoType: string) {
            switch (atmoType) {
                case 'TEMP':
                    return {
                        min: -20,
                        max: 50,
                        title: 'Temperatur (°C)'
                    };
                case 'HUMID':
                    return {
                        min: 0,
                        max: 100,
                        title: 'Luftfeuchtigkeit (%)'
                    };
                case 'PRESS':
                    return {
                        min: 950,
                        max: 1050,
                        title: 'Druck (hPa)'
                    };
                default:
                    return {
                        min: 0,
                        max: 100,
                        title: ''
                    };
            }
        }

        const getAtmoImprovements = (atmoType: 'TEMP' | 'HUMID' | 'PRESS') => {
            const descriptions: {
                [key: string]: {
                    [x: string]: any; title: string; content: string[]
                }
            } = {
                TEMP: {
                    title: 'Möglichkeiten zur Verbesserung der Temperatur',
                    sections: [
                        {
                            heading: 'Drinnen',
                            items: [
                                { title: 'Thermostatsteuerung', description: 'Verwenden Sie programmierbare Thermostate, um die Temperatur in Ihrem Zuhause zu steuern und sie nachts oder während Ihrer Abwesenheit zu senken.' },
                                { title: 'Energieeffizienz', description: 'Verbessern Sie die Energieeffizienz Ihres Hauses durch gute Isolierung, Dichtungen an Fenstern und Türen sowie die Verwendung von energieeffizienten Heiz- und Kühlsystemen.' },
                                { title: 'Schattenspender', description: 'Verwenden Sie Vorhänge oder Jalousien, um direkte Sonneneinstrahlung während heißer Tage zu blockieren und so die Raumtemperatur zu senken.' },
                            ],
                        },
                        {
                            heading: 'Draußen',
                            items: [
                                { title: 'Stadtplanung', description: 'Unterstützen Sie städtebauliche Planungen, die auf eine Reduzierung von Hitzeinseln in urbanen Gebieten abzielen, wie Grünanlagen und Straßenbäume.' },
                            ],
                        },
                    ],
                    content: []
                },
                PRESS: {
                    title: 'Möglichkeiten zur Verbesserung des Drucks',
                    sections: [
                        {
                            heading: 'Drinnen',
                            items: [
                                { title: 'Fensterabdichtung', description: 'Stellen Sie sicher, dass Fenster und Türen gut abgedichtet sind, um einen konstanten Luftdruck im Inneren zu gewährleisten und Energieverluste zu minimieren' },
                            ],
                        },
                    ],
                    content: []
                },
                HUMID: {
                    title: 'Möglichkeiten zur Verbesserung der Luftfeuchtigkeit',
                    sections: [
                        {
                            heading: 'Drinnen',
                            items: [
                                { title: 'Luftbefeuchter', description: 'Verwenden Sie Luftbefeuchter, um die Luftfeuchtigkeit in Innenräumen zu erhöhen, besonders während der trockenen Wintermonate.' },
                                { title: 'Pflanzenpflege', description: 'Das regelmäßige Besprühen von Zimmerpflanzen oder das Platzieren von Wasserbehältern in der Nähe von Heizkörpern kann die Luftfeuchtigkeit erhöhen.' },
                                { title: 'Lüften', description: 'Lüften Sie regelmäßig, um frische Luft hereinzulassen und überschüssige Feuchtigkeit abzuführen.' },
                                { title: 'Vermeiden Sie Überhitzung', description: 'Reduzieren Sie die Raumtemperatur, da kühle Luft tendenziell mehr Feuchtigkeit aufnehmen kann.'},
                            ],
                        },
                        {
                            heading: 'Draußen',
                            items: [
                                { title: 'Wässern', description: 'Bewässern Sie Pflanzen und Bäume in Ihrer Umgebung regelmäßig, um die Luftfeuchtigkeit in der Nähe zu erhöhen.' },
                            ],
                        },
                    ],
                    content: []
                },
            };
            return descriptions[atmoType];
        };

        const getAtmoDescription = (atmoType: 'TEMP' | 'HUMID' | 'PRESS') => {
            const descriptions: { [key: string]: { title: string; content: string[] } } = {
                TEMP: {
                    title: 'Wissenswertes zur Temperatur',
                    content: [
                        'Die Temperatur wird in Grad Celsius (°C) gemessen und beschreibt, wie warm oder kalt die Umgebung ist.',
                        '20°C bis 22°C gelten als optimale Raumtemperatur für Komfort und Gesundheit.',
                        'Temperaturen unter 0°C können zu Unterkühlung führen, während Temperaturen über 25°C Hitzestress und Dehydration verursachen können.',
                        'Langfristige Exposition gegenüber extremen Temperaturen kann zu gesundheitlichen Problemen wie Herz-Kreislauf-Erkrankungen führen.',
                        'Hohe Temperaturen können auch die Luftqualität beeinträchtigen und zu einer erhöhten Konzentration von Luftschadstoffen führen.'
                    ]
                },
                HUMID: {
                    title: 'Wissenswertes zur Luftfeuchtigkeit',
                    content: [
                        'Relative Luftfeuchtigkeit wird in Prozent (%) gemessen und beschreibt, wie viel Wasserdampf in der Luft vorhanden ist, relativ zur maximalen Menge, die sie halten kann.',
                        'Eine ideale relative Luftfeuchtigkeit für Innenräume liegt zwischen 40% und 60%.',
                        'Zu niedrige Luftfeuchtigkeit kann zu trockener Haut, Reizungen der Atemwege und erhöhtem Infektionsrisiko führen.',
                        'Hohe Luftfeuchtigkeit kann Schimmelbildung begünstigen und Beschwerden bei Menschen mit Atemwegserkrankungen verstärken.',
                        'Extreme Luftfeuchtigkeit kann auch die Wärmewahrnehmung beeinflussen und zu Hitzestress führen.'
                    ]
                },
                PRESS: {
                    title: 'Wissenswertes zum Umgebungsdruck',
                    content: [
                        'Der atmosphärische Druck wird in Hektopascal (hPa) gemessen und ist ein Indikator für das Gewicht der Luft über uns.',
                        'Auf Meereshöhe liegt der durchschnittliche Luftdruck bei etwa 1013 hPa.',
                        'Niedriger Luftdruck kann bei empfindlichen Personen Kopfschmerzen und Gelenkschmerzen verursachen.',
                        'In großen Höhen, wo der Luftdruck niedriger ist, kann es zu Höhenkrankheit kommen, die Symptome wie Schwindel, Übelkeit und Erschöpfung umfasst.',
                        'Druckveränderungen werden oft mit Wetteränderungen in Verbindung gebracht und können das Wohlbefinden beeinflussen.'
                    ]
                },
            };
            return descriptions[atmoType];
        };

        const chartOptions = computed(() => {
            const yAxisSettings = getYAxisSettings(selectedAtmo.value);

            // Funktion zur Anpassung der Gitterlinienfarbe und -stärke
            function getGridLineColor(value: number) {
                switch (selectedAtmo.value) {
                    case 'TEMP':
                        if (value === 0) return 'rgba(20, 70, 120, 0.5)';
                        break;
                    case 'HUMID':
                        if (value === 40 || value === 60) return 'rgba(0, 255, 0, 0.5)';
                        break;
                    case 'PRESS':
                        if (value === 980 || value === 1020) return 'rgba(0, 255, 0, 0.5)';
                        break;
                }
                return 'rgba(0,0,0,0.1)'; // Standardfarbe für andere Linien
            }

            const annotations = {
                annotations: {
                    tempRangeComfort: {
                        type: 'box',
                        yMin: 20,
                        yMax: 22,
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        borderWidth: 0,
                    },
                    tempRangeCold: {
                        type: 'box',
                        yMin: 0,
                        yMax: 20,
                        backgroundColor: 'rgba(135, 206, 250, 0.1)',
                        borderWidth: 0,
                    },
                    tempRangeFreezing: {
                        type: 'box',
                        yMin: -20,
                        yMax: 0,
                        backgroundColor: 'rgba(0, 0, 255, 0.1)',
                        borderWidth: 0,
                    },
                    tempRangeWarm: {
                        type: 'box',
                        yMin: 22,
                        yMax: 30,
                        backgroundColor: 'rgba(255, 255, 0, 0.1)',
                        borderWidth: 0,
                    },
                    tempRangeHot: {
                        type: 'box',
                        yMin: 30,
                        yMax: 50,
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        borderWidth: 0,
                    }
                }
            };

            return {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        right: 50,
                    }
                },
                plugins: {
                    annotation: selectedAtmo.value === 'TEMP' ? annotations : {},
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
                            },

                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: getYAxisTitle(selectedAtmo.value),
                            font: {
                                size: 16,
                                weight: 500
                            },
                            padding: { bottom: -5 }
                        },
                        min: yAxisSettings.min,
                        max: yAxisSettings.max,
                        // Passt das Raster der y-Achse an um Hilfslinien hinzuzufügen
                        grid: {
                            color: function (context: { tick: { value: number; }; }) {
                                return getGridLineColor(context.tick.value);
                            },
                            lineWidth: function (context: { tick: { value: number; }; }) {
                                // Dickere Linien für Schwellenwerte
                                if ([0, 20, 22, 30, 40, 60, 980, 1020].includes(context.tick.value)) {
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
            }
        });

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

        watch(selectedAtmo, () => {
            chartOptions.value.scales.y.title.text = getYAxisTitle(selectedAtmo.value); // Aktualisiere die Y-Achsenbezeichnung
            initializeChartData();
        }, { immediate: true });


        return {
            chartData,
            showInfoModal,
            showSettingsModal,
            showChart,
            selectedAtmo,
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
            reactiveChartOptions,
            getAtmoDescription,
            getAtmoImprovements
        };
    }
})
</script>
<style scoped>
@import "@/assets/SharedStyles.css";

.chart-inner-container {
    width: 100%;
    height: auto;
    margin: auto;
}
</style>