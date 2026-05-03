import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Grid3x3, Loader2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { SECTOR_COLORS } from '@/constants'
import type { Sector } from '@/types'

const sectorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  min_coverage: z.number().int().min(0).default(1),
  color: z.string().default('#3b82f6'),
})

type SectorFormData = z.infer<typeof sectorSchema>

function SectorForm({
  sector,
  onClose,
  companyId,
}: {
  sector?: Sector
  onClose: () => void
  companyId: string
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<SectorFormData>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      name: sector?.name ?? '',
      description: sector?.description ?? '',
      min_coverage: sector?.min_coverage ?? 1,
      color: sector?.color ?? '#3b82f6',
    },
  })

  const selectedColor = watch('color')

  const onSubmit = async (data: SectorFormData) => {
    if (sector) {
      await supabase.from('sectors').update(data).eq('id', sector.id)
    } else {
      await supabase.from('sectors').insert({ ...data, company_id: companyId })
    }
    queryClient.invalidateQueries({ queryKey: ['sectors'] })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome <span className="text-destructive">*</span></Label>
        <Input placeholder="Ex: Salão" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input placeholder="Descrição opcional" {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label>Cobertura mínima (funcionários)</Label>
        <Input type="number" min={0} {...register('min_coverage', { valueAsNumber: true })} />
      </div>

      <div className="space-y-2">
        <Label>Cor do setor</Label>
        <div className="flex flex-wrap gap-2 pt-1">
          {SECTOR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: selectedColor === color ? 'white' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <Save className="h-4 w-4 mr-2" />
          {sector ? 'Salvar' : 'Criar Setor'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function SectorsPage() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Sector | undefined>()
  const queryClient = useQueryClient()

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ['sectors', user?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sectors')
        .select('*')
        .eq('company_id', user?.company_id ?? '')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name')
      return (data ?? []) as Sector[]
    },
    enabled: !!user?.company_id,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from('sectors')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sectors'] }),
  })

  const openCreate = () => { setEditTarget(undefined); setModalOpen(true) }
  const openEdit = (s: Sector) => { setEditTarget(s); setModalOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sectors.length} setores cadastrados</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sectors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Grid3x3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-sm font-medium mb-1">Nenhum setor cadastrado</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Setores representam as áreas de trabalho do restaurante (Salão, Cozinha, Delivery...)
            </p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Criar primeiro setor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sector) => (
            <Card key={sector.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: sector.color }}
                    />
                    <CardTitle className="text-base">{sector.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(sector)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(sector.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sector.description && (
                  <p className="text-xs text-muted-foreground mb-2">{sector.description}</p>
                )}
                <Badge variant="outline" className="text-xs">
                  Mín. {sector.min_coverage} funcionário{sector.min_coverage !== 1 ? 's' : ''}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
          </DialogHeader>
          {user?.company_id && (
            <SectorForm
              sector={editTarget}
              onClose={() => setModalOpen(false)}
              companyId={user.company_id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
