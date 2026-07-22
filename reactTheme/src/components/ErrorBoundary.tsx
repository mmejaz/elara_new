import { Button, Result } from 'antd'
import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  resetKey?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render errors in the routed page subtree so a single broken page
 * shows a recoverable fallback instead of white-screening the whole app.
 * `resetKey` (e.g. the current pathname) clears the error on navigation.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          extra={
            <Button type="primary" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
          }
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
