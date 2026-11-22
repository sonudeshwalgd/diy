import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { captureAppError } from "../services/appErrorStore";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureAppError(error, {
      source: "react",
      fatal: true,
      componentStack: info.componentStack ?? null,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-stone-50 px-8">
          <Text className="text-lg font-sans-extrabold text-stone-900">
            Something went wrong
          </Text>
          <Text className="mt-2 text-center text-sm font-sans-medium text-stone-500">
            The error was saved. Please try again.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="mt-6 rounded-full bg-orange-600 px-6 py-3"
          >
            <Text className="text-sm font-sans-bold text-white">Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
