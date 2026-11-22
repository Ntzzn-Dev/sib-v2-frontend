import { useEffect, useState } from "react";
import { Check, LogOut } from "lucide-react";
import { jsonRequest, request } from "../../api/client";
import { FieldInput, FieldSelect, FormError, Modal } from "../../components/ui";

const emptyProfile = {
  email: "", nomePessoa: "", telPessoa: "", senhaAtual: "", novaSenha: "",
  endPessoa: { uf: "", cep: "", cidade: "", bairro: "", logradouro: "", numero: "", complemento: "" },
};

const addressFields = [
  ["uf", "UF"], ["cep", "CEP"], ["cidade", "Cidade"], ["bairro", "Bairro"],
  ["logradouro", "Logradouro"], ["numero", "Número"], ["complemento", "Complemento"],
];

export default function MyProfileModal({ onClose, onSaved, onSignOut, fallbackAddress, notify }) {
  const [form, setForm] = useState(emptyProfile);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ufs, setUfs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    request("/auth/me").then((profile) => {
      setForm((current) => ({
        ...current,
        ...profile,
        endPessoa: { ...current.endPessoa, ...(profile.endPessoa || fallbackAddress || {}) },
      }));
    }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    request("/enderecos/ufs").then(setUfs).catch(() => setUfs([]));
  }, []);

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const setAddress = (name, value) => setForm((current) => ({ ...current, endPessoa: { ...current.endPessoa, [name]: value } }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = await request("/auth/me", jsonRequest("PUT", { ...form, endPessoa: form.endPessoa }));
      await onSaved(saved);
      notify("Perfil atualizado com sucesso.");
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const addressFilled = Object.values(form.endPessoa).some((value) => value?.trim());

  return <Modal title="Meu perfil" subtitle="Atualize seus dados pessoais, endereço e, se desejar, sua senha." onClose={onClose} wide>
    <form className="form-body" onSubmit={submit}>
      {loading && <p className="field-hint">Carregando dados atuais do perfil e do endereço…</p>}
      <div className="form-grid">
        <FieldInput label="Nome completo" required value={form.nomePessoa} onChange={(event) => set("nomePessoa", event.target.value)} />
        <FieldInput label="E-mail de login" required type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
        <FieldInput label="Telefone" value={form.telPessoa || ""} onChange={(event) => set("telPessoa", event.target.value)} />
        <FieldInput label="Senha atual" type="password" autoComplete="current-password" value={form.senhaAtual} onChange={(event) => set("senhaAtual", event.target.value)} />
        <FieldInput label="Nova senha" type="password" autoComplete="new-password" value={form.novaSenha} onChange={(event) => set("novaSenha", event.target.value)} />
      </div>
      <h3 className="form-section-title">Endereço</h3>
      <div className="form-grid">
        {addressFields.map(([name, label]) => name === "uf" ? (
          <FieldSelect key={name} label={label} required={addressFilled} value={form.endPessoa.uf || ""} onChange={(event) => setAddress("uf", event.target.value)}>
            <option value="">Selecione o estado</option>
            {ufs.map((estado) => <option key={estado.uf} value={estado.uf}>{estado.nome}</option>)}
          </FieldSelect>
        ) : (
          <FieldInput key={name} label={label} required={addressFilled && name !== "complemento"} value={form.endPessoa[name] || ""} onChange={(event) => setAddress(name, event.target.value)} />
        ))}
      </div>
      <FormError>{error}</FormError>
      <div className="modal-actions">
        <button type="button" className="button button-ghost signout-profile-button" onClick={onSignOut} disabled={busy || loading}><LogOut size={17} /> Sair da conta</button>
        <button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button>
        <button className="button button-primary" disabled={busy || loading}>{busy ? <span className="spinner" /> : <Check size={18} />}{busy ? "Salvando…" : "Salvar perfil"}</button>
      </div>
    </form>
  </Modal>;
}
