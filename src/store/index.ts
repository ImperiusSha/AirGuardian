// store/index.ts

import { createStore } from 'vuex'

interface SensorDataPoint {
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    co2Value?: number;
    pm10Value?: number;
    pm25Value?: number;
    tempValue?: number;
}


export default createStore({
    state: {
        co2Values: [] as { timestamp: string, value: number }[],
        pm10Values: [] as { timestamp: string, value: number }[],
        pm25Values: [] as { timestamp: string, value: number }[],
        tempValues: [] as number[],
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
        // Entfernt doppelt Einträge durch die Verwendung von newSet()
        // Filtert leere Werte durch die Verwendung von filter()
        removeEmptyAndDuplicate(state) {
            state.co2Values = [...new Set(state.co2Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.pm10Values = [...new Set(state.pm10Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
            state.pm25Values = [...new Set(state.pm25Values)].filter(value => value !== null && value !== undefined && value.toString() !== '');
        },
        addTempValue(state, value: number) {
            state.tempValues.push(value);
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
