// components/common/LoadingScreen.jsx
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo animado */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shadow-accent">
            <span className="text-primary font-heading font-black text-3xl">V</span>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-accent animate-ping opacity-20" />
        </div>
        <div className="text-center">
          <p className="text-white font-heading font-bold text-xl tracking-wide">Vitrina Empresarial</p>
          <p className="text-white/50 text-sm mt-1 font-body">Cargando...</p>
        </div>
        {/* Barra de progreso */}
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  )
}
