import { AlertTriangle, ExternalLink, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
      title="Copiar"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function SetupScreen() {
  const envContent = `VITE_SUPABASE_URL=https://seu-projeto.supabase.co\nVITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui`

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Configuração Necessária</h1>
          <p className="text-sm text-muted-foreground">
            O Supabase ainda não foi configurado. Siga os passos abaixo para conectar o banco de dados.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs w-5 h-5 shrink-0">1</span>
                Criar projeto no Supabase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Acesse o Supabase, crie um projeto e obtenha as credenciais em{' '}
                <span className="font-mono text-primary">Project Settings → API</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Abrir Supabase Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs w-5 h-5 shrink-0">2</span>
                Configurar o arquivo <span className="font-mono">.env</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Edite o arquivo <span className="font-mono text-primary">.env</span> na raiz do projeto:
              </p>
              <div className="relative rounded-md bg-muted border border-border p-3 font-mono text-xs text-muted-foreground">
                <div>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui</div>
                <div className="absolute top-2 right-2">
                  <CopyButton text={envContent} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs w-5 h-5 shrink-0">3</span>
                Executar as migrations do banco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                No Supabase Dashboard → SQL Editor, execute os arquivos em ordem:
              </p>
              <div className="space-y-1">
                {[
                  'src/database/migrations/001_initial_schema.sql',
                  'src/database/migrations/002_indexes.sql',
                  'src/database/migrations/003_rls_policies.sql',
                  'src/database/migrations/004_functions.sql',
                  'src/database/seeds/001_holidays.sql',
                ].map((file) => (
                  <div key={file} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    {file}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs w-5 h-5 shrink-0">4</span>
                Reiniciar o servidor de desenvolvimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted border border-border p-3 font-mono text-xs text-muted-foreground flex items-center justify-between">
                <span>npm run dev</span>
                <CopyButton text="npm run dev" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Button className="w-full" onClick={() => window.location.reload()}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Já configurei — Recarregar
        </Button>
      </div>
    </div>
  )
}
