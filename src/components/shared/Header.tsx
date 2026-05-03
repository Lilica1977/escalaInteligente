import { Menu, Bell, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Funcionários',
  '/employees/new': 'Novo Funcionário',
  '/schedules': 'Escalas',
  '/sectors': 'Setores',
  '/shifts': 'Turnos',
  '/holidays': 'Feriados',
  '/alerts': 'Alertas',
  '/settings': 'Configurações',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Escala Inteligente'

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
          >
            3
          </Badge>
        </Button>
      </div>
    </header>
  )
}
