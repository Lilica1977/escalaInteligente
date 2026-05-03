import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useEmployee, useCreateEmployee, useUpdateEmployee, useRoles, useSectors, useWorkRegimes } from '@/hooks/useEmployees'
import { employeeSchema, type EmployeeFormData } from '@/validations/employee'
import { CONTRACT_TYPES } from '@/constants'
import { Skeleton } from '@/components/ui/skeleton'

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: employee, isLoading: loadingEmployee } = useEmployee(id)
  const { data: roles = [] } = useRoles()
  const { data: sectors = [] } = useSectors()
  const { data: workRegimes = [] } = useWorkRegimes()

  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee(id ?? '')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      gender: 'M',
      contract_type: 'CLT',
      can_open_store: false,
      can_close_store: false,
      can_work_sundays: true,
      sunday_days_off_count: 1,
      max_consecutive_days: 6,
    },
  })

  useEffect(() => {
    if (employee && isEdit) {
      reset({
        name: employee.name,
        nickname: employee.nickname ?? '',
        phone: employee.phone ?? '',
        gender: employee.gender,
        role_id: employee.role_id,
        sector_id: employee.sector_id,
        work_regime_id: employee.work_regime_id,
        contract_type: employee.contract_type,
        hire_date: employee.hire_date,
        termination_date: employee.termination_date ?? '',
        can_open_store: employee.can_open_store,
        can_close_store: employee.can_close_store,
        can_work_sundays: employee.can_work_sundays,
        sunday_days_off_count: employee.sunday_days_off_count,
        max_consecutive_days: employee.max_consecutive_days,
        notes: employee.notes ?? '',
      })
    }
  }, [employee, isEdit, reset])

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data)
      } else {
        await createMutation.mutateAsync(data)
      }
      navigate('/employees')
    } catch {
      // error handled by mutation
    }
  }

  if (isEdit && loadingEmployee) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/employees')} className="h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            {isEdit ? `Editar: ${employee?.name ?? ''}` : 'Novo Funcionário'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Altere as informações do funcionário' : 'Preencha os dados do novo funcionário'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Pessoais</CardTitle>
            <CardDescription>Dados básicos do funcionário</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Nome completo" required error={errors.name?.message}>
                <Input placeholder="João da Silva" {...register('name')} />
              </FormField>
            </div>

            <FormField label="Apelido" error={errors.nickname?.message}>
              <Input placeholder="Ex: Joãozinho" {...register('nickname')} />
            </FormField>

            <FormField label="Telefone" error={errors.phone?.message}>
              <Input placeholder="(11) 99999-9999" {...register('phone')} />
            </FormField>

            <FormField label="Sexo" required error={errors.gender?.message}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Vínculo Empregatício */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vínculo Empregatício</CardTitle>
            <CardDescription>Cargo, setor e regime de trabalho</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <FormField label="Cargo" required error={errors.role_id?.message}>
              <Controller
                name="role_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r: { id: string; name: string }) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Setor principal" required error={errors.sector_id?.message}>
              <Controller
                name="sector_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((s: { id: string; name: string }) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Regime de trabalho" required error={errors.work_regime_id?.message}>
              <Controller
                name="work_regime_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      {workRegimes.map((r: { id: string; name: string }) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Tipo de contratação" required error={errors.contract_type?.message}>
              <Controller
                name="contract_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Data de admissão" required error={errors.hire_date?.message}>
              <Input type="date" {...register('hire_date')} />
            </FormField>

            <FormField label="Data de desligamento" error={errors.termination_date?.message}>
              <Input type="date" {...register('termination_date')} />
            </FormField>
          </CardContent>
        </Card>

        {/* Regras Operacionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regras Operacionais</CardTitle>
            <CardDescription>Configurações de escala e CLT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Máx. dias consecutivos" error={errors.max_consecutive_days?.message}>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  {...register('max_consecutive_days', { valueAsNumber: true })}
                />
              </FormField>

              <FormField label="Domingos de folga por mês" error={errors.sunday_days_off_count?.message}>
                <Input
                  type="number"
                  min={0}
                  max={4}
                  {...register('sunday_days_off_count', { valueAsNumber: true })}
                />
              </FormField>
            </div>

            <div className="space-y-4">
              {[
                { name: 'can_open_store' as const, label: 'Pode abrir a loja', desc: 'Habilitado para abrir o estabelecimento' },
                { name: 'can_close_store' as const, label: 'Pode fechar a loja', desc: 'Habilitado para fechar o estabelecimento' },
                { name: 'can_work_sundays' as const, label: 'Pode trabalhar aos domingos', desc: 'Disponível para escala aos domingos' },
              ].map(({ name, label, desc }) => (
                <div key={name} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Controller
                    name={name}
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Informações adicionais sobre o funcionário..."
              rows={3}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar funcionário'}
          </Button>
        </div>
      </form>
    </div>
  )
}
