declare module 'react-native-background-actions' {
  interface TaskOptions {
    taskName: string;
    taskTitle: string;
    taskDesc: string;
    taskIcon?: { name: string; type: string };
    color?: string;
    linkingURI?: string;
    parameters?: object;
    progressBar?: { max: number; value: number; indeterminate?: boolean };
    notificationChannel?: {
      channelId: string;
      channelName: string;
      notificationId: number;
      importance: number;
    };
  }

  interface BackgroundActionsInstance {
    start: (task: (options: TaskOptions) => Promise<void>, options: TaskOptions) => Promise<void>;
    stop: () => Promise<void>;
  }

  const instance: BackgroundActionsInstance;
  export default instance;
}
