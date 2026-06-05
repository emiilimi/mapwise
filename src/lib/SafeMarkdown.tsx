import { Component, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { markdownComponents, markdownUrlTransform } from "./markdownComponents";

// Felles markdown-render for hele appen (kart, utforsk, presenter). Samler
// plugin-oppsettet ett sted og slipper gjennom `data:image`-URI-er via
// `markdownUrlTransform`. En error-boundary fanger render-feil (f.eks. ugyldig
// rå-HTML gjennom rehype-raw) slik at én slide ikke blanker ut hele skjermen.

interface BoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

class MarkdownErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidUpdate(prev: BoundaryProps) {
    // Nullstill når innholdet endrer seg, så en ny (gyldig) slide kan rendre.
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export function SafeMarkdown({ children }: { children: string }) {
  return (
    <MarkdownErrorBoundary
      fallback={
        <p className="text-sm italic text-red-500">
          Kunne ikke vise innholdet (ugyldig markdown/HTML).
        </p>
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
        urlTransform={markdownUrlTransform}
      >
        {children}
      </ReactMarkdown>
    </MarkdownErrorBoundary>
  );
}
