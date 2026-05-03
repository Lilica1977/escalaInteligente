import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Clock, Loader2, Save } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Shift } from '@/types'

const shiftSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  start_time: z.string().min(1, 'Horário de início obrigatório'),
  end_time: z.string().min(1, 'Horário de término obrigatório'),
  duration_hours: z.number().min(1).max(24),
  is_overnight: z.boolean().default(false),
})

type ShiftFormData = z.infer<typeof shiftSchema>

function ShiftForm({
  shift,
  onClose,
  companyId,
}: {
  shift?: Shift
  onClose: () => void
  companyId: string
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      name: shift?.name ?? '',
      start_time: shift?.start_time?.slice(0, 5) ?? '08:00',
      end_time: shift?.end_time?.slice(0, 5) ?? '17:00',
      duration_hours: shift?.duration_hours ?? 9,
      is_overnight: shift?.is_overnight ?? false,
    },
  })

  const onSubmit = async (data: ShiftFormData) => {
    if (shift) {
      await supabase.from('shifts').update(data).eq('id', shift.id)
    } else {
      await supabase.from('shifts').insert({ ...data, company_id: companyId })
    }
    queryClient.invalidateQueries({ queryKey: ['shifts'] })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do turno <span className="text-destructive">*</span></Label>
        <Input placeholder="Ex: Turno Manhã" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Início <span className="text-destructive">*</span></Label>
          <Input type="time" {...register('start_time')} />
          {errors.start_time && <p className="text-xs text-destructive">{errors.start_time.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Término <span className="text-destructive">*</span></Label>
          <Input type="time" {...register('end_time')} />
          {errors.end_time && <p className="text-xs text-destructive">{errors.end_time.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Duração (horas)</Label>
        <Input
          type="number"
          step="0.5"
          min={1}
          max={24}
          {...register('duration_hours', { valueAsNumber: true })}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Turno noturno</p>
          <p className="text-xs text-muted-foreground">Atravessa a meia-noite</p>
        </div>
        <Controller
          name="is_overnight"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <Save className="h-4 w-4 mr-2" />
          {shift ? 'Salvar' : 'Criar Turno'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ShiftsPage() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Shift | undefined>()
  const queryClient = useQueryClient()

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts', user?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('company_id', user?.company_id ?? '')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('start_time')
      return (data ?? []) as Shift[]
    },
    enabled: !!user?.company_id,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('shifts')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })

  const openCreate = () => { setEditTarget(undefined); setModalOpen(true) }
  const openEdit = (s: Shift) => { setEditTarget(s); setModalOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{shifts.length} turnos cadastrados</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Turno
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-medium mb-1">Nenhum turno cadastrado</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Turnos definem os horários de trabalho dos funcionários
              </p>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Criar primeiro turno
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turno</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.name}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                    </TableCell>
                    <TableCell>{shift.duration_hours}h</TableCell>
                    <TableCell>
                      <Badge variant={shift.is_overnight ? 'info' : 'outline'}>
                        {shift.is_overnight ? 'Noturno' : 'Diurno'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(shift)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(shift.id)}
                          disabled={deleteMutation.isPending}
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
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar Turno' : 'Novo Turno'}</DialogTitle>
          </DialogHeader>
          {user?.company_id && (
            <ShiftForm
              shift={editTarget}
              onClose={() => setModalOpen(false)}
              companyId={user.company_id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
