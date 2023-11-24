// store/index.ts

import { createStore } from 'vuex'

interface SensorDataPoint {
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    co2Value?: number;
    temp_co2Values?: number;
    pm10Value?: number;
    pm25Value?: number;
    tempValue?: number;
    pressValue?: number;
    humidValue?: number;
}


export default createStore({
    state: {
        co2Values: [] as { timestamp: string, value: number }[],
        temp_co2Values: [] as { timestamp: string, value: number }[],
        pm10Values: [] as { timestamp: string, value: number }[],
        pm25Values: [] as { timestamp: string, value: number }[],
        tempValues: [] as { timestamp: string, value: number }[],
        pressValues: [] as { timestamp: string, value: number }[],
        humidValues: [] as { timestamp: string, value: number }[],
        sensorData: [] as SensorDataPoint[],
    },
    mutations: {
        addCo2Value(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.co2Values.length === 0 || state.co2Values[state.co2Values.length - 1].value !== value) {
                state.co2Values.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.co2Values.length > 15) {
                    state.co2Values.shift();
                }
            }
        },
        addtempCo2Value(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.temp_co2Values.length === 0 || state.temp_co2Values[state.temp_co2Values.length - 1].value !== value) {
                state.temp_co2Values.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.temp_co2Values.length > 15) {
                    state.temp_co2Values.shift();
                }
            }
        },
        addPM10Value(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.pm10Values.length === 0 || state.pm10Values[state.pm10Values.length - 1].value !== value) {
                state.pm10Values.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.pm10Values.length > 15) {
                    state.pm10Values.shift();
                }
            }
        },
        addPM25Value(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.pm25Values.length === 0 || state.pm25Values[state.pm25Values.length - 1].value !== value) {
                state.pm25Values.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.pm25Values.length > 15) {
                    state.pm25Values.shift();
                }
            }
        },
        addTempValue(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.tempValues.length === 0 || state.tempValues[state.tempValues.length - 1].value !== value) {
                state.tempValues.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.tempValues.length > 15) {
                    state.tempValues.shift();
                }
            }
        },
        addPressValue(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.pressValues.length === 0 || state.pressValues[state.pressValues.length - 1].value !== value) {
                state.pressValues.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.pressValues.length > 15) {
                    state.pressValues.shift();
                }
            }
        },
        addHumidValue(state, value: number) {
            // Prüfen, ob bereits ein Element mit dem gleichen Zeitstempel vorhanden ist
            // Prüfen, ob vorheriges Element den gleichen Wert hat
            if (state.humidValues.length === 0 || state.humidValues[state.humidValues.length - 1].value !== value) {
                state.humidValues.push({
                    timestamp: new Date().toISOString(),
                    value: value,
                });
                // Begrenzung auf maximal 15 Werte im Diagramm
                if (state.humidValues.length > 15) {
                    state.humidValues.shift();
                }
            }
        },
        // Entfernt doppelt Einträge durch die Verwendung von newSet()
        // Filtert leere Werte durch die Verwendung von filter()
        removeEmptyAndDuplicate(state) {
            state.co2Values = [...new Set(state.co2Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.temp_co2Values = [...new Set(state.temp_co2Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.pm10Values = [...new Set(state.pm10Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.pm25Values = [...new Set(state.pm25Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.tempValues = [...new Set(state.tempValues)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.pressValues = [...new Set(state.pressValues)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.humidValues = [...new Set(state.humidValues)].filter(value => value !== null && value !== undefined && value.toString() !== '');
        },
        SET_SENSOR_DATA(state, data) {
            state.sensorData = data;
        },
        ADD_LOCATION_AND_DATA(state, payload) {
            state.sensorData.push(payload);
        }
    },
    actions: {
        addLocationAndData({ commit }, payload) {
            commit('ADD_LOCATION_AND_DATA', payload);
        }
    },
    getters: {
        sensorData: state => state.sensorData
    },
    modules: {

    }
})
