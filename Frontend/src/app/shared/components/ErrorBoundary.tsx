import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
          p={3}
          textAlign="center"
        >
          <AlertTriangle size={48} color="#ef4444" />
          <Typography variant="h5" mt={2} mb={1} fontWeight="bold">
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: "#f3f4f6",
              p: 2,
              borderRadius: 1,
              overflow: "auto",
              maxWidth: "100%",
              fontSize: "0.75rem",
              textAlign: "left",
            }}
          >
            {this.state.errorInfo?.componentStack}
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 3 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
