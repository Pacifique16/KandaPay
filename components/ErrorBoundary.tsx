import React, { Component, ComponentType, PropsWithChildren } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type Props = PropsWithChildren<{ onError?: (error: Error) => void }>;
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Pressable onPress={() => this.setState({ error: null })} style={styles.btn}>
            <Text style={styles.btnText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  btn: { backgroundColor: "#1A237E", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
