import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <span className="text-accent font-black text-4xl font-heading">V</span>
        </div>
        <h1 className="text-7xl font-heading font-black text-primary mb-2">404</h1>
        <p className="text-xl font-heading font-bold text-primary mb-2">Página no encontrada</p>
        <p className="text-primary/50 mb-8 max-w-sm mx-auto">La página que buscas no existe o fue movida.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">← Volver al inicio</Link>
      </div>
    </div>
  )
}
