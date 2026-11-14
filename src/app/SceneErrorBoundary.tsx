import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SceneErrorBoundaryProps {
  readonly children: ReactNode;
  /** What to show instead, once something below has failed. */
  readonly fallback: ReactNode;
}

interface SceneErrorBoundaryState {
  readonly failed: boolean;
}

/**
 * Catches a scene that cannot start (a WebGL context lost or refused, a shader that does not
 * compile on some GPU) and shows the accessible list instead of a blank page. A class, because
 * React only offers error boundaries as classes.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  override state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('El árbol no pudo dibujarse; se muestra la lista.', error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
