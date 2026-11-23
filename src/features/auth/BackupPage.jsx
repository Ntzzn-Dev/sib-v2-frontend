import { useState } from "react";
import {
  Check,
  Database,
  HardDriveDownload,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { request } from "../../api/client";
import { FormError, PageHeading } from "../../components/ui";

export default function BackupPage({ notify, onRestored }) {
  const [busy, setBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [error, setError] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [backup, setBackup] = useState(null);
  const [arquivoRestauracao, setArquivoRestauracao] = useState(null);
  const [confirmacaoRestauracao, setConfirmacaoRestauracao] = useState("");

  const criarBackup = async () => {
    setBusy(true);
    setError("");
    setBackup(null);
    try {
      const resultado = await request("/backup", { method: "POST" });
      setBackup(resultado);
      notify("Backup do banco de dados criado.");
    } catch (backupError) {
      setError(backupError.message);
    } finally {
      setBusy(false);
    }
  };

  const restaurarBackup = async () => {
    if (!arquivoRestauracao || confirmacaoRestauracao !== "RESTAURAR") return;
    setRestoreBusy(true);
    setRestoreError("");
    const formulario = new FormData();
    formulario.append("arquivo", arquivoRestauracao);
    try {
      await request("/backup/restaurar", { method: "POST", body: formulario });
      if (onRestored) {
        await onRestored();
      } else {
        notify("Backup restaurado. Entre novamente no sistema.");
      }
    } catch (restoreError) {
      setRestoreError(restoreError.message);
    } finally {
      setRestoreBusy(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRAÇÃO"
        title={<>Backup <em>do banco.</em></>}
        description="Gere uma cópia completa do banco de dados quando precisar."
      />
      <section className="panel email-settings-panel">
        <div className="email-settings-intro">
          <span className="indicator-icon"><Database size={19} /></span>
          <div>
            <strong>Backup manual</strong>
            <p>O arquivo será gravado na pasta padrão de backup configurada no SQL Server.</p>
          </div>
        </div>
        <div className="form-body">
          <div className="email-settings-note">
            <ShieldCheck size={17} />
            <span>
              O arquivo fica no computador do serviço SQL Server, não na pasta Downloads deste navegador. A conta do SQL Server precisa ter permissão para gravar nessa pasta. Se gerar outro backup no mesmo minuto, o arquivo anterior com esse nome será substituído.
            </span>
          </div>
          <FormError>{error}</FormError>
          {backup && (
            <div className="backup-result" role="status">
              <div className="backup-result-heading"><Check size={17} /> Backup criado em {backup.criadoEm}</div>
              <strong>{backup.arquivo}</strong>
              <code>{backup.caminho}</code>
            </div>
          )}
          <div className="modal-actions">
            <button className="button button-primary" onClick={criarBackup} disabled={busy}>
              {busy ? <span className="spinner" /> : <HardDriveDownload size={17} />}
              {busy ? "Gerando backup…" : "Gerar backup agora"}
            </button>
          </div>
        </div>
      </section>

      <section className="panel email-settings-panel backup-restore-panel">
        <div className="email-settings-intro">
          <span className="indicator-icon"><Upload size={19} /></span>
          <div>
            <strong>Importar e restaurar backup</strong>
            <p>A restauração substitui os dados atuais do banco brecho pelos dados do arquivo.</p>
          </div>
        </div>
        <div className="form-body">
          <label className="backup-file-field">
            <span>Arquivo de backup (.bak)</span>
            <input
              type="file"
              accept=".bak,application/octet-stream"
              disabled={restoreBusy}
              onChange={(event) => {
                setArquivoRestauracao(event.target.files?.[0] || null);
                event.target.value = "";
                setConfirmacaoRestauracao("");
                setRestoreError("");
              }}
            />
          </label>
          {arquivoRestauracao && (
            <div className="backup-selected-file">
              Selecionado: <strong>{arquivoRestauracao.name}</strong> ({(arquivoRestauracao.size / (1024 * 1024)).toFixed(1)} MB)
            </div>
          )}
          <div className="backup-restore-warning">
            A restauração desconecta as sessões abertas e substitui os dados atuais. O arquivo precisa ser um backup completo do banco brecho.
          </div>
          <label className="backup-confirm-field">
            Digite <strong>RESTAURAR</strong> para confirmar
            <input
              value={confirmacaoRestauracao}
              onChange={(event) => setConfirmacaoRestauracao(event.target.value.trim().toUpperCase())}
              disabled={restoreBusy}
              autoComplete="off"
            />
          </label>
          <FormError>{restoreError}</FormError>
          <div className="modal-actions">
            <button
              className="button button-primary"
              onClick={restaurarBackup}
              disabled={restoreBusy || !arquivoRestauracao || confirmacaoRestauracao !== "RESTAURAR"}
            >
              {restoreBusy ? <span className="spinner" /> : <Upload size={17} />}
              {restoreBusy ? "Restaurando banco…" : "Importar e restaurar"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
