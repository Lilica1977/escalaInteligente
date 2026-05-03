import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, Grid3x3,
  Clock, Star, Bell, Settings, LogOut, CalendarClock,
  X, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/utils/format'

const navItems = [
  {
    group: 'Principal',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/schedules', label: 'Escalas', icon: CalendarDays },
      { to: '/alerts', label: 'Alertas', icon: Bell },
    ],
  },
  {
    group: 'Cadastros',
    items: [
      { to: '/employees', label: 'Funcionários', icon: Users },
      { to: '/sectors', label: 'Setores', icon: Grid3x3 },
      { to: '/shifts', label: 'Turnos', icon: Clock },
      { to: '/holidays', label: 'Feriados', icon: Star },
    ],
  },
  {
    group: 'Sistema',
    items: [
      { to: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/20 border border-primary/30 p-1.5">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">Escala</p>
              <p className="text-xs text-primary font-semibold leading-tight">Inteligente</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
          {navItems.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-2">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User area */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <Separator className="mb-3 bg-sidebar-border" />
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-bold">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name ?? 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                {user?.email ?? ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  )
}
