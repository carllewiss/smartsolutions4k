// db-backup: admin-only database export to CSV part files in the private `backups` bucket.
// Actions: start | table | finish | fail
// Large tables export in pages of PAGE rows keyed by `id` (one call per page) so
// multi-million-row tables never exceed the function time limit.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAGE = 5000

function csvField(v: unknown): string {
  if (v === null || v === undefined) return ''
  // JSON-encode then CSV-quote so restore can reconstruct typed values exactly
  return '"' + JSON.stringify(v).replace(/"/g, '""') + '"'
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) throw new Error('Not signed in')
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userErr || !userData.user) throw new Error('Invalid session')
  const { data: roles, error: roleErr } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
  if (roleErr) throw new Error('Could not verify permissions')
  if (!roles?.some((r: { role: string }) => r.role === 'admin')) throw new Error('Only admins can run backups')
  return { admin, user: userData.user }
}

async function loadManifest(admin: ReturnType<typeof createClient>, runId: string) {
  const dl = await admin.storage.from('backups').download(`${runId}/manifest.json`)
  if (dl.error) throw new Error('Manifest not found: ' + dl.error.message)
  return JSON.parse(await dl.data.text()) as { run_id: string; tables: { table: string; columns: { name: string }[] }[] }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { admin, user } = await requireAdmin(req)
    const body = await req.json()

    if (body.action === 'start') {
      // Ordered table list with row estimates and columns comes from the DB itself
      const { data: manifest, error } = await admin.rpc('backup_manifest', { p_user_id: user.id })
      if (error || !manifest) throw new Error('Could not build backup manifest: ' + (error?.message ?? ''))
      const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8)
      const tables = (manifest as { table_name: string; restore_order: number; row_estimate: string | number; columns: unknown }[])
        .sort((a, b) => a.restore_order - b.restore_order)
        .map((t) => ({ table: t.table_name, restore_order: t.restore_order, row_estimate: Number(t.row_estimate), columns: t.columns }))
      const manifestObj = { run_id: runId, created_at: new Date().toISOString(), created_by: user.id, tables }
      const { error: upErr } = await admin.storage
        .from('backups')
        .upload(`${runId}/manifest.json`, JSON.stringify(manifestObj), { contentType: 'application/json', upsert: true })
      if (upErr) throw new Error('Could not save manifest: ' + upErr.message)
      const { error: histErr } = await admin.from('backup_history').insert({
        kind: 'manual',
        target: 'cloud-storage',
        file_name: runId,
        table_count: tables.length,
        status: 'running',
        created_by: user.id,
      })
      if (histErr) throw new Error('Could not log backup: ' + histErr.message)
      return new Response(JSON.stringify({ ok: true, run_id: runId, tables }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'table') {
      const runId = String(body.run_id ?? '')
      const table = String(body.table ?? '')
      if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error('Invalid table name')
      if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error('Invalid run id')
      const afterId = body.after_id == null ? null : String(body.after_id)
      const part = Math.max(1, Number(body.part ?? 1) | 0)
      const manifestObj = await loadManifest(admin, runId)
      const entry = manifestObj.tables.find((t) => t.table === table)
      if (!entry) throw new Error('Table not in manifest')
      const columns = entry.columns.map((c) => c.name)

      let q = admin.from(table).select('*').order('id', { ascending: true }).limit(PAGE)
      if (afterId) q = q.gt('id', afterId)
      const { data, error } = await q
      if (error) throw new Error(`Could not read ${table}: ` + error.message)
      const rows = (data ?? []) as Record<string, unknown>[]
      if (rows.length === 0) {
        return new Response(JSON.stringify({ ok: true, table, rows: 0, done: true, last_id: afterId, part: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const csv = columns.map((c) => '"' + c + '"').join(',') + '\n'
        + rows.map((r) => columns.map((c) => csvField(r[c])).join(',')).join('\n') + '\n'
      const { error: upErr } = await admin.storage
        .from('backups')
        .upload(`${runId}/${table}.csv.part-${String(part).padStart(6, '0')}`, csv, { contentType: 'text/csv', upsert: true })
      if (upErr) throw new Error(`Could not save ${table} part ${part}: ` + upErr.message)
      const lastId = String(rows[rows.length - 1].id)
      return new Response(JSON.stringify({ ok: true, table, rows: rows.length, done: rows.length < PAGE, last_id: lastId, part }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'secrets') {
      // Export integration credentials (Daraja/M-Pesa etc.) so a restore can re-provision them.
      // Project-intrinsic keys (SUPABASE_*) are excluded on purpose.
      const names = [
        'MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_PASSKEY', 'MPESA_PAYBILL', 'MPESA_SHORTCODE',
        'MPESA_ENV', 'MPESA_CALLBACK_BASE_URL', 'DARAJA_CONSUMER_KEY', 'DARAJA_CONSUMER_SECRET',
        'DARAJA_PASSKEY', 'DARAJA_SHORTCODE', 'PORTAL1_SERVICE_ROLE_KEY', 'PORTAL2_SERVICE_ROLE_KEY',
        'PORTAL1_URL', 'PORTAL2_URL', 'GOOGLE_DRIVE_REFRESH_TOKEN', 'FTP_HOST', 'FTP_USER', 'FTP_PASSWORD',
      ]
      const found: Record<string, string> = {}
      for (const n of names) {
        const v = Deno.env.get(n)
        if (v) found[n] = v
      }
      const runId = String(body.run_id ?? '')
      if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error('Invalid run id')
      const { error: upErr } = await admin.storage
        .from('backups')
        .upload(`${runId}/secrets.json`, JSON.stringify({ exported_at: new Date().toISOString(), secrets: found }), {
          contentType: 'application/json',
          upsert: true,
        })
      if (upErr) throw new Error('Could not save secrets: ' + upErr.message)
      return new Response(JSON.stringify({ ok: true, secrets: Object.keys(found).length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'finish') {
      const runId = String(body.run_id ?? '')
      if (!/^[a-zA-Z0-9._-]+$/.test(runId)) throw new Error('Invalid run id')
      const { data: files, error: listErr } = await admin.storage.from('backups').list(runId, { limit: 10000 })
      if (listErr) throw new Error('Could not list backup files: ' + listErr.message)
      let totalBytes = 0
      const tables = new Set<string>()
      for (const f of files ?? []) {
        if (f.name === 'manifest.json') continue
        totalBytes += f.metadata?.size ?? 0
        tables.add(f.name.split('.csv.part-')[0])
      }
      const { data: hist, error: histErr } = await admin
        .from('backup_history')
        .select('id, row_count, table_count')
        .eq('file_name', runId)
        .maybeSingle()
      if (histErr || !hist) throw new Error('Backup log entry not found')
      const { error: updErr } = await admin
        .from('backup_history')
        .update({ status: 'success', size_bytes: totalBytes, table_count: tables.size || hist.table_count, row_count: body.row_count ?? hist.row_count ?? null })
        .eq('id', hist.id)
      if (updErr) throw new Error('Could not finalize backup: ' + updErr.message)
      return new Response(JSON.stringify({ ok: true, size_bytes: totalBytes, table_count: tables.size }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'fail') {
      const runId = String(body.run_id ?? '')
      await admin.from('backup_history').update({ status: 'failed', error: String(body.error ?? 'unknown') }).eq('file_name', runId)
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    throw new Error('Unknown action')
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
