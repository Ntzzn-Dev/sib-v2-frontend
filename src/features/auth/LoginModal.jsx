import { useState } from "react";
import { BadgeCheck, LogIn, UserRound } from "lucide-react";
import { request, jsonRequest } from "../../api/client";
import { FieldInput, FormError, Modal } from "../../components/ui";
import { formatCpf } from "../../lib/format";

export default function LoginModal({ data, onClose, onLogin, notify }) {
  const [mode, setMode] = useState(
    data.funcionarios.length === 0 ? "signup" : "login",
  );
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salario, setSalario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signingUp = mode === "signup";

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const normalizedCpf = cpf.replace(/\D/g, "");
    try {
      if (signingUp) {
        if (senha !== confirmarSenha)
          throw new Error("As senhas não coincidem.");
        const employee = await request(
          "/funcionarios",
          jsonRequest("POST", {
            cpfPessoa: normalizedCpf,
            nomePessoa: nome.trim(),
            telPessoa: telefone,
            salarioFunc: Number(salario),
            senha,
            endPessoa: null,
          }),
        );
        onLogin({
          cpfPessoa: employee.cpfPessoa,
          nomePessoa: employee.nomePessoa,
          message: "Conta criada e login realizado",
        });
        notify(
          `Conta criada. Bem-vindo(a), ${employee.nomePessoa.split(" ")[0]}!`,
        );
        onClose();
      } else {
        const user = await request(
          "/auth/login",
          jsonRequest("POST", { cpf: normalizedCpf, senha }),
        );
        onLogin(user);
        notify(`Bem-vindo(a), ${user.nomePessoa.split(" ")[0]}!`);
        onClose();
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setError("");
    setMode((current) => (current === "login" ? "signup" : "login"));
  };

  return (
    <Modal
      title={
        signingUp ? "Crie seu acesso ao SIB." : "Que bom ter você por aqui."
      }
      subtitle={
        signingUp
          ? "Cadastre seu perfil de funcionário para começar a usar o sistema."
          : "Entre com seu cadastro de funcionário para começar uma venda."
      }
      onClose={onClose}
    >
      <form className="form-body" onSubmit={submit}>
        {signingUp && (
          <FieldInput
            label="Nome completo"
            required
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Como podemos chamar você?"
            autoFocus
          />
        )}
        <FieldInput
          label="CPF"
          required
          inputMode="numeric"
          maxLength={14}
          pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
          value={cpf}
          onChange={(event) => setCpf(formatCpf(event.target.value))}
          placeholder="000.000.000-00"
          autoFocus={!signingUp}
        />
        {signingUp && (
          <div className="signup-fields">
            <FieldInput
              label="Telefone"
              inputMode="tel"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              placeholder="(11) 99999-9999"
            />
            <FieldInput
              label="Salário mensal"
              required
              type="number"
              min="0"
              step="0.01"
              value={salario}
              onChange={(event) => setSalario(event.target.value)}
              placeholder="0,00"
            />
          </div>
        )}
        <FieldInput
          label="Senha"
          required
          type="password"
          minLength={signingUp ? 3 : undefined}
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          placeholder={signingUp ? "Crie uma senha" : "Sua senha"}
        />
        {signingUp && (
          <FieldInput
            label="Confirme a senha"
            required
            type="password"
            minLength={3}
            value={confirmarSenha}
            onChange={(event) => setConfirmarSenha(event.target.value)}
            placeholder="Digite a senha novamente"
          />
        )}
        <FormError>{error}</FormError>
        <div className="login-info">
          <BadgeCheck size={17} />
          <span>
            {signingUp
              ? "Seu cadastro será criado na API do SIB v2."
              : "Seu acesso é validado pela API do SIB v2."}
          </span>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={onClose}
          >
            Agora não
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? (
              <span className="spinner" />
            ) : signingUp ? (
              <UserRound size={16} />
            ) : (
              <LogIn size={16} />
            )}
            {busy
              ? signingUp
                ? "Criando conta…"
                : "Validando…"
              : signingUp
                ? "Criar conta"
                : "Entrar no sistema"}
          </button>
        </div>
        <div className="login-switch">
          {signingUp ? "Já tem uma conta?" : "Ainda não tem cadastro?"}{" "}
          <button type="button" onClick={switchMode}>
            {signingUp ? "Fazer login" : "Criar conta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
