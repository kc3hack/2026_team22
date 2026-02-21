declare module 'react-native-screen-lock-unlock-listener' {
    import type { NativeModule } from 'react-native';
    interface ScreenLockUnlockListenerModule extends NativeModule {
        addListener(eventType: string): void;
        removeListeners(count: number): void;
    }
    const ScreenLockUnlockListener: ScreenLockUnlockListenerModule;
    export default ScreenLockUnlockListener;
}
