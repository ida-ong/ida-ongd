import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[IDA] Erreur pendant le rendu React.', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-section" role="alert">
          <div className="container">
            <h1>Une erreur est survenue lors du chargement de l’application.</h1>
            <p>Veuillez actualiser la page. Si le problème persiste, consultez la console développeur.</p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
