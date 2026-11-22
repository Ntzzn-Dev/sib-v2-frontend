import { useEffect, useState } from "react";
import { Check, Mail, Send, ShieldCheck } from "lucide-react";
import { request, jsonRequest } from "../../api/client";
import { FieldInput, FormError, PageHeading } from "../../components/ui";

const EMAIL_REMETENTE_PADRAO = "noreply.sibrecho@gmail.com";

export default function EmailSettingsPage({ notify }) {
  const [emailRemetente, setEmailRemetente] = useState(EMAIL_REMETENTE_PADRAO);
  const [senhaApp, setSenhaApp] = useState("");
  const [senhaConfigurada, setSenhaConfigurada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const carregar = async () => {
    setLoading(true);
    setError("");
    try {
      const configuracao = await request("/auth/email-config");
      setEmailRemetente(configuracao.emailRemetente || EMAIL_REMETENTE_PADRAO);
      setSenhaConfigurada(configuracao.senhaConfigurada);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvar = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const configuracao = await request(
        "/auth/email-config",
        jsonRequest("PUT", { emailRemetente, senhaApp }),
      );
      setEmailRemetente(configuracao.emailRemetente);
      setSenhaConfigurada(configuracao.senhaConfigurada);
      setSenhaApp("");
      notify("Configuração do e-mail salva.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const testar = async () => {
    setBusy(true);
    setError("");
    try {
      await request("/auth/email-config/teste", { method: "POST" });
      notify(`E-mail de teste enviado para ${emailRemetente}.`);
    } catch (testError) {
      setError(testError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="CONFIGURAÇÃO"
        title={<>E-mail <em>remetente.</em></>}
        description="Configure a conta Gmail que enviará senhas temporárias aos funcionários."
      />
      <section className="panel email-settings-panel">
        <div className="email-settings-intro">
          <span className="indicator-icon"><Mail size={19} /></span>
          <div>
            <strong>{senhaConfigurada ? "Remetente configurado" : "Configure o remetente"}</strong>
            <p>
              {loading
                ? "Carregando configuração…"
                : senhaConfigurada
                  ? `As mensagens sairão por ${emailRemetente}. A senha não é exibida nesta tela.`
                  : "A senha de app do Gmail ainda não foi cadastrada."}
            </p>
          </div>
        </div>
        <form className="form-body" onSubmit={salvar}>
          <div className="form-grid">
            <FieldInput
              label="E-mail remetente"
              required
              type="email"
              autoComplete="email"
              value={emailRemetente}
              onChange={(event) => setEmailRemetente(event.target.value)}
              placeholder={EMAIL_REMETENTE_PADRAO}
            />
            <FieldInput
              label={senhaConfigurada ? "Nova senha de app (opcional)" : "Senha de app do Gmail"}
              required={!senhaConfigurada}
              type="password"
              autoComplete="new-password"
              value={senhaApp}
              onChange={(event) => setSenhaApp(event.target.value)}
              placeholder={senhaConfigurada ? "Deixe em branco para manter a atual" : "Cole a senha de app do Google"}
              hint="Use a senha de app gerada na Conta Google, não a senha normal da conta."
            />
          </div>
          <div className="email-settings-note">
            <ShieldCheck size={17} />
            <span>
              O envio usa Gmail SMTP (smtp.gmail.com, porta 587 com TLS). A senha de app fica salva na tabela de configuração do sistema.
            </span>
          </div>
          <FormError>{error}</FormError>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-outline"
              onClick={testar}
              disabled={busy || loading || !senhaConfigurada}
            >
              <Send size={16} /> Enviar teste
            </button>
            <button className="button button-primary" disabled={busy || loading}>
              {busy ? <span className="spinner" /> : <Check size={17} />}
              {busy ? "Salvando…" : "Salvar configuração"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
