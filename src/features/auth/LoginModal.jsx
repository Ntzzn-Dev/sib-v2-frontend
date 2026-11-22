import { useState } from "react";
import { BadgeCheck, LogIn } from "lucide-react";
import { request, jsonRequest } from "../../api/client";
import { FieldInput, FormError, Modal } from "../../components/ui";

export default function LoginModal({ onClose, onLogin, onSignup, allowSignup, notify }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [recuperando, setRecuperando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMensagem("");
    try {
      if (recuperando) {
        const response = await request(
          "/auth/esqueci-senha",
          jsonRequest("POST", { email: email.trim() }),
        );
        setMensagem(response.mensagem);
        return;
      }
      const user = await request(
        "/auth/login",
        jsonRequest("POST", { email: email.trim(), senha }),
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

  const voltarDoEsqueciSenha = () => {
    if (recuperando) {
      setRecuperando(false);
      setError("");
      setMensagem("");
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={recuperando ? "Recupere seu acesso." : "Que bom ter você por aqui."}
      subtitle={recuperando
        ? "Informe o e-mail do seu cadastro para receber uma senha temporária."
        : "Entre com seu cadastro de funcionário para começar a usar o sistema."}
      onClose={onClose}
    >
      <form className="form-body" onSubmit={submit}>
        <FieldInput
          label="E-mail"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@exemplo.com"
          autoFocus
        />
        {!recuperando && <FieldInput
          label="Senha"
          required
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          placeholder="Sua senha"
          autoComplete="current-password"
        />}
        <FormError>{error}</FormError>
        {mensagem ? (
          <div className="login-info"><BadgeCheck size={17} /><span>{mensagem}</span></div>
        ) : !recuperando && (
          <div className="login-info">
            <BadgeCheck size={17} />
            <span>Use o e-mail cadastrado para acessar o sistema.</span>
          </div>
        )}
        {!recuperando && <button
          type="button"
          className="text-button login-forgot"
          onClick={() => { setRecuperando(true); setError(""); setMensagem(""); }}
        >
          Esqueci minha senha
        </button>}
        <div className="modal-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={voltarDoEsqueciSenha}
          >
            {recuperando ? "Voltar ao login" : "Agora não"}
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? <span className="spinner" /> : recuperando ? <BadgeCheck size={16} /> : <LogIn size={16} />}
            {busy ? recuperando ? "Enviando…" : "Validando…" : recuperando ? "Enviar senha temporária" : "Entrar no sistema"}
          </button>
        </div>
        {!recuperando && allowSignup && <div className="login-switch">
          Primeiro acesso ao sistema?{" "}
          <button type="button" onClick={onSignup}>
            Cadastrar administrador
          </button>
        </div>}
      </form>
    </Modal>
  );
}
