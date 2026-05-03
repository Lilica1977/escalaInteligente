import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Edit, Trash2, Users, Phone,
  RefreshCw, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees'
import { getInitials, formatPhone } from '@/utils/format'
import type { Employee } from '@/types'

const CONTRACT_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'warning' | 'info'> = {
  CLT: 'default',
  intermitente: 'warning',
  freelancer: 'info',
  folguista: 'secondary',
  extra: 'outline',
}

export function EmployeesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const { data, isLoading, error, refetch } = useEmployees({
    search: search || undefined,
    page,
    per_page: 20,
  })
  const deleteMutation = useDeleteEmployee()

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {data?.count ?? 0} funcionários cadastrados
          </p>
        </div>
        <Button onClick={() => navigate('/employees/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      <Card>
        {/* Search bar */}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou apelido..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-10 w-10">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-sm text-muted-foreground">Erro ao carregar funcionários</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-medium mb-1">Nenhum funcionário encontrado</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {search ? 'Tente outro termo de busca' : 'Comece cadastrando o primeiro funcionário'}
              </p>
              {!search && (
                <Button size="sm" onClick={() => navigate('/employees/new')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Cadastrar Funcionário
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="hidden md:table-cell">Cargo / Setor</TableHead>
                  <TableHead className="hidden lg:table-cell">Contrato</TableHead>
                  <TableHead className="hidden lg:table-cell">Regime</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className="text-xs font-bold"
                            style={{
                              backgroundColor: `${employee.sector?.color ?? '#3b82f6'}20`,
                              color: employee.sector?.color ?? '#3b82f6',
                            }}
                          >
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{employee.name}</p>
                          {employee.nickname && (
                            <p className="text-xs text-muted-foreground">"{employee.nickname}"</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-sm">{employee.role?.name ?? '—'}</p>
                        <div className="flex items-center gap-1">
                          {employee.sector && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: employee.sector.color }}
                            />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {employee.sector?.name ?? '—'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={CONTRACT_BADGE[employee.contract_type] ?? 'outline'}>
                        {employee.contract_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {employee.work_regime?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {employee.phone ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {formatPhone(employee.phone)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/employees/${employee.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(employee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {page} de {data.total_pages} ({data.count} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page >= data.total_pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Funcionário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Esta ação pode
              ser revertida pelo administrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
