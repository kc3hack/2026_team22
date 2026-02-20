import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useAlarmStore } from './alarmStore';
import { useSleepSettingsStore } from '../sleep-settings/sleepSettingsStore';
import { MissionCamera } from './components/MissionCamera';

export const AlarmScreen = () => {
    const { currentPhase, stopAlarm, snoozeAlarm, isAlarmRinging } = useAlarmStore();
    const { missionEnabled, missionTarget } = useSleepSettingsStore();
    const [showCamera, setShowCamera] = React.useState(false);

    // If alarm is not ringing, we shouldn't be here ideally, but for safety:
    if (!isAlarmRinging) return null;

    const handleStop = () => {
        if (missionEnabled && currentPhase === 'strict') {
            setShowCamera(true);
        } else {
            stopAlarm();
        }
    };

    const handleMissionComplete = () => {
        stopAlarm();
        setShowCamera(false);
    };

    if (showCamera) {
        return (
            <MissionCamera
                targetLabel={missionTarget}
                onComplete={handleMissionComplete}
            />
        );
    }

    return (
        <View style={[styles.container, currentPhase === 'strict' ? styles.strictBg : styles.gentleBg]}>
            <Text style={styles.timeText}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>

            <Text style={styles.phaseText}>
                {currentPhase === 'gentle' ? 'Good Morning (Gentle)' : 'WAKE UP NOW! (Strict)'}
            </Text>

            <View style={styles.controls}>
                {/* Snooze available only in Gentle phase or if mission not strict? */}
                {currentPhase === 'gentle' && (
                    <TouchableOpacity style={styles.button} onPress={snoozeAlarm}>
                        <Text style={styles.buttonText}>Snooze (-5 min)</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.button, styles.stopButton]}
                    onPress={handleStop}
                >
                    <Text style={styles.buttonText}>
                        {currentPhase === 'strict' && missionEnabled ? `Mission: ${missionTarget}` : 'Stop Alarm'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gentleBg: {
        backgroundColor: '#e0f7fa',
    },
    strictBg: {
        backgroundColor: '#ffcdd2',
    },
    timeText: {
        fontSize: 64,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    phaseText: {
        fontSize: 24,
        marginBottom: 40,
    },
    controls: {
        gap: 20,
        width: '80%',
    },
    button: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    stopButton: {
        backgroundColor: '#ff5252',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
