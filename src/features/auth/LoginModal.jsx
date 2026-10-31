import { useState } from "react";
import { BadgeCheck, LogIn } from "lucide-react";
import { request, jsonRequest } from "../../api/client";
import { FieldInput, FormError, Modal } from "../../components/ui";
import { formatCpf } from "../../lib/format";

export default function LoginModal({ onClose, onLogin, onSignup, notify }) {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await request(
        "/auth/login",
        jsonRequest("POST", { cpf: cpf.replace(/\D/g, ""), senha }),
      );
      onLogin(user);
      notify(`Bem-vindo(a), ${user.nomePessoa.split(" ")[0]}!`);
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Que bom ter você por aqui."
      subtitle="Entre com seu cadastro de funcionário para começar a usar o sistema."
      onClose={onClose}
    >
      <form className="form-body" onSubmit={submit}>
        <FieldInput
          label="CPF"
          required
          inputMode="numeric"
          maxLength={14}
          pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
          value={cpf}
          onChange={(event) => setCpf(formatCpf(event.target.value))}
          placeholder="000.000.000-00"
          autoFocus
        />
        <FieldInput
          label="Senha"
          required
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          placeholder="Sua senha"
        />
        <FormError>{error}</FormError>
        <div className="login-info">
          <BadgeCheck size={17} />
          <span>Use o CPF e a senha cadastrados para entrar.</span>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button-ghost" onClick={onClose}>
            Agora não
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <LogIn size={16} />}
            {busy ? "Validando…" : "Entrar no sistema"}
          </button>
        </div>
        <div className="login-switch">
          Ainda não tem cadastro?{" "}
          <button type="button" onClick={onSignup}>
            Criar conta
          </button>
        </div>
      </form>
    </Modal>
  );
}
