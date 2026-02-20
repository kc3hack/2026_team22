import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { geminiClient } from '@shared/lib/gemini';

interface MissionCameraProps {
  onComplete: () => void;
  targetLabel: string;
}

export const MissionCamera = ({ onComplete, targetLabel }: MissionCameraProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isAnalyzing) {
      try {
        setIsAnalyzing(true);
        // Capture with Base64 for API
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });

        if (photo?.base64) {
          const isMatch = await geminiClient.verifyMissionImage(photo.base64, targetLabel);

          if (isMatch) {
            Alert.alert('Mission Complete!', 'おはよう！今日も1日頑張ろう！', [
              {
                text: 'OK',
                onPress: () => onComplete(),
              },
            ]);
          } else {
            Alert.alert(
              'Mission Failed',
              `This doesn't look like a ${targetLabel}. Please try again.`,
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error) {
        console.error('Failed to take picture or verify', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isAnalyzing && styles.buttonDisabled]}
            onPress={takePicture}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.text}>📸 Verify {targetLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    opacity: 0.7,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
});
