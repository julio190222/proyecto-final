// components/layout/Footer.jsx
import { Link } from 'react-router-dom'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-20">
      <div className="page-section py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <span className="text-primary font-black text-lg font-heading">V</span>
              </div>
              <div>
                <p className="font-heading font-bold">Vitrina Empresarial Digital</p>
                <p className="text-white/50 text-xs">Impulsando emprendedores</p>
              </div>
            </div>
            <p className="text-white/60 text-sm font-body leading-relaxed">
              Plataforma institucional que conecta emprendedores con clientes, impulsando el desarrollo económico local.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="font-heading font-bold mb-4 text-accent">Navegación</h4>
            <ul className="space-y-2 text-sm font-body">
              {[
                { to: '/',           label: 'Inicio' },
                { to: '/categorias', label: 'Categorías' },
                { to: '/buscar',     label: 'Buscar' },
                { to: '/login',      label: 'Ingresar' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-white/60 hover:text-accent transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-heading font-bold mb-4 text-accent">Contacto</h4>
            <ul className="space-y-3 text-sm font-body text-white/60">
              <li className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-accent flex-shrink-0" />
                Colombia
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-accent flex-shrink-0" />
                contacto@vitrina.co
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-body">
          <p>© {new Date().getFullYear()} Vitrina Empresarial Digital. Todos los derechos reservados.</p>
          <p>Datos simulados — Proyecto académico</p>
        </div>
      </div>
    </footer>
  )
}
