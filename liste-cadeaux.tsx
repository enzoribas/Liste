import { useState, useEffect } from "react";
import { Gift, Plus, Link as LinkIcon, Trash2, Image as ImageIcon, Sparkles, Eye, EyeOff, UserPlus } from "lucide-react";

const PALETTE = {
  bg: "#FBF6EF",
  card: "#FFFFFF",
  ink: "#2E2A25",
  sub: "#8A8072",
  rose: "#C6584F",
  roseSoft: "#F4E1DD",
  pine: "#3F5B4E",
  pineSoft: "#E1EAE3",
  gold: "#C79A3E",
  line: "#E6DCCB",
};

const THEMES = [PALETTE.rose, PALETTE.pine, PALETTE.gold];

function themeFor(name) {
  if (!name) return { main: PALETTE.sub, soft: "#EFEAE1" };
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const c = THEMES[Math.abs(hash) % THEMES.length];
  const softMap = { [PALETTE.rose]: PALETTE.roseSoft, [PALETTE.pine]: PALETTE.pineSoft, [PALETTE.gold]: "#F3E9D2" };
  return { main: c, soft: softMap[c] };
}

function GiftTag({ item, onDelete, onToggleVisible, onOpenPhoto, currentUser }) {
  const theme = themeFor(item.pour);
  const isForMe = item.pour === currentUser;
  const hiddenFromRecipient = item.visible === false;
  return (
    <div
      style={{
        background: PALETTE.card,
        borderRadius: 14,
        border: `1px solid ${PALETTE.line}`,
        padding: 18,
        position: "relative",
        boxShadow: "0 1px 2px rgba(46,42,37,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -8,
          left: 22,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: PALETTE.bg,
          border: `1px solid ${PALETTE.line}`,
        }}
      />
      {item.photo ? (
        <button
          onClick={() => onOpenPhoto(item.photo, item.titre)}
          aria-label="Voir la photo en grand"
          style={{
            width: "100%",
            height: 140,
            borderRadius: 10,
            overflow: "hidden",
            background: theme.soft,
            border: "none",
            padding: 0,
            cursor: "zoom-in",
          }}
        >
          <img
            src={item.photo}
            alt={item.titre}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </button>
      ) : (
        <div
          style={{
            width: "100%",
            height: 90,
            borderRadius: 10,
            background: theme.soft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.main,
          }}
        >
          <Gift size={28} strokeWidth={1.5} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: PALETTE.ink, lineHeight: 1.25 }}>
            {item.titre}
          </div>
          {item.note && (
            <div style={{ fontSize: 13, color: PALETTE.sub, marginTop: 4, lineHeight: 1.4 }}>{item.note}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {!isForMe && (
            <button
              onClick={() => onToggleVisible(item.id)}
              aria-label={hiddenFromRecipient ? "Révéler ce cadeau" : "Garder la surprise"}
              title={hiddenFromRecipient ? `Caché à ${item.pour} — cliquer pour révéler` : `Cliquer pour cacher à ${item.pour}`}
              style={{
                background: "transparent",
                border: "none",
                color: PALETTE.sub,
                cursor: "pointer",
                padding: 4,
              }}
            >
              {hiddenFromRecipient ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            aria-label="Supprimer cette idée"
            style={{
              background: "transparent",
              border: "none",
              color: PALETTE.sub,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: theme.main,
            background: theme.soft,
            padding: "3px 9px",
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          Pour {item.pour}
        </span>
        {hiddenFromRecipient && !isForMe && (
          <span style={{ fontSize: 11, color: PALETTE.rose, fontStyle: "italic" }}>🎁 Surprise</span>
        )}
        {item.lien && (
          <a
            href={item.lien}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: PALETTE.ink,
              display: "flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              borderBottom: `1px solid ${PALETTE.line}`,
            }}
          >
            <LinkIcon size={12} /> Voir le lien
          </a>
        )}
      </div>
    </div>
  );
}

export default function GiftList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("Tous");

  const [form, setForm] = useState({ titre: "", pour: "", photo: "", lien: "", note: "", visible: true });
  const [photoBusy, setPhotoBusy] = useState(false);
  const [people, setPeople] = useState(["Enzo", "Angélina"]);
  const [addingPerson, setAddingPerson] = useState(false);
  const [newPerson, setNewPerson] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [identityWarning, setIdentityWarning] = useState(false);
  const [codes, setCodes] = useState({});
  const [pendingPerson, setPendingPerson] = useState(null);
  const [codeMode, setCodeMode] = useState(null); // 'create' | 'enter'
  const [codeInput, setCodeInput] = useState("");
  const [codeConfirmInput, setCodeConfirmInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    load();
    loadPeople();
    loadIdentity();
    loadCodes();
  }, []);

  async function loadIdentity() {
    try {
      const res = await window.storage.get("current-user-name", false);
      if (res && res.value) setCurrentUser(res.value);
    } catch (e) {
      // pas encore choisi sur cet appareil
    } finally {
      setIdentityLoaded(true);
    }
  }

  async function loadCodes() {
    try {
      const res = await window.storage.get("gift-codes", true);
      if (res && res.value) setCodes(JSON.parse(res.value));
    } catch (e) {
      // aucun code encore créé
    }
  }

  async function persistIdentity(name) {
    setCurrentUser(name);
    setIdentityWarning(false);
    try {
      if (name === null) {
        await window.storage.delete("current-user-name", false);
      } else {
        const res = await window.storage.set("current-user-name", name, false);
        if (!res) {
          setIdentityWarning(true);
          setDebugInfo("set current-user-name → réponse vide");
        }
      }
    } catch (e) {
      if (name !== null) {
        setIdentityWarning(true);
        setDebugInfo(`set current-user-name → ${e && e.message ? e.message : String(e)}`);
      }
    }
  }

  function startPickPerson(name) {
    if (name === currentUser) return;
    setPendingPerson(name);
    setCodeInput("");
    setCodeConfirmInput("");
    setCodeError("");
    setCodeMode(codes[name] ? "enter" : "create");
  }

  function cancelCodeEntry() {
    setPendingPerson(null);
    setCodeMode(null);
    setCodeInput("");
    setCodeConfirmInput("");
    setCodeError("");
  }

  async function submitCode(e) {
    e.preventDefault();
    if (codeMode === "create") {
      if (!/^\d{4}$/.test(codeInput)) {
        setCodeError("Le code doit contenir 4 chiffres.");
        return;
      }
      if (codeInput !== codeConfirmInput) {
        setCodeError("Les deux codes ne correspondent pas.");
        return;
      }
      const nextCodes = { ...codes, [pendingPerson]: codeInput };
      setCodes(nextCodes);
      let saveFailed = false;
      let debugMsg = "";
      try {
        const res = await window.storage.set("gift-codes", JSON.stringify(nextCodes), true);
        if (!res) {
          saveFailed = true;
          debugMsg = "réponse vide";
        }
      } catch (e) {
        saveFailed = true;
        debugMsg = e && e.message ? e.message : String(e);
      }
      persistIdentity(pendingPerson);
      if (saveFailed) {
        setIdentityWarning(true);
        setDebugInfo(`set gift-codes → ${debugMsg}`);
      }
      cancelCodeEntry();
    } else {
      if (codeInput === codes[pendingPerson]) {
        persistIdentity(pendingPerson);
        cancelCodeEntry();
      } else {
        setCodeError("Code incorrect.");
        setCodeInput("");
      }
    }
  }

  async function loadPeople() {
    try {
      const res = await window.storage.get("gift-people", true);
      if (res && res.value) {
        const saved = JSON.parse(res.value);
        if (Array.isArray(saved) && saved.length) setPeople(saved);
      }
    } catch (e) {
      // keep defaults
    }
  }

  async function savePeople(next) {
    setPeople(next);
    try {
      await window.storage.set("gift-people", JSON.stringify(next), true);
    } catch (e) {
      setError("Impossible d'enregistrer cette personne, réessaie.");
    }
  }

  function handleAddPerson() {
    const name = newPerson.trim();
    if (!name) {
      setAddingPerson(false);
      return;
    }
    if (!people.includes(name)) savePeople([...people, name]);
    setForm((f) => ({ ...f, pour: name }));
    setNewPerson("");
    setAddingPerson(false);
  }

  function handlePhotoPick(file) {
    if (!file) return;
    setPhotoBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1400;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        // Garde-fou : si le fichier reste trop lourd pour le stockage, on recompresse.
        if (dataUrl.length > 4_500_000) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        }
        setForm((f) => ({ ...f, photo: dataUrl }));
        setPhotoBusy(false);
      };
      img.onerror = () => setPhotoBusy(false);
      img.src = reader.result;
    };
    reader.onerror = () => setPhotoBusy(false);
    reader.readAsDataURL(file);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await window.storage.get("gift-ideas", true);
      setItems(res && res.value ? JSON.parse(res.value) : []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function save(next) {
    setItems(next);
    try {
      const res = await window.storage.set("gift-ideas", JSON.stringify(next), true);
      if (!res) setError("La sauvegarde a échoué, réessaie.");
    } catch (e) {
      setError("La sauvegarde a échoué, réessaie.");
    }
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.titre.trim() || !form.pour.trim()) return;
    const next = [
      { id: Date.now().toString(), ...form, titre: form.titre.trim(), pour: form.pour.trim() },
      ...items,
    ];
    save(next);
    setForm({ titre: "", pour: "", photo: "", lien: "", note: "", visible: true });
    setShowForm(false);
  }

  function handleDelete(id) {
    save(items.filter((i) => i.id !== id));
  }

  function handleToggleVisible(id) {
    save(items.map((i) => (i.id === id ? { ...i, visible: i.visible === false ? true : false } : i)));
  }

  const byPerson = filter === "Tous" ? items : items.filter((i) => i.pour === filter);
  const visible = byPerson.filter((i) => !(i.visible === false && i.pour === currentUser));

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 60px" }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: PALETTE.rose, marginBottom: 6 }}>
            <Sparkles size={16} />
            <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
              Liste partagée
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 32,
              color: PALETTE.ink,
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Idées cadeaux à deux
          </h1>
          <p style={{ color: PALETTE.sub, fontSize: 14, marginTop: 8, maxWidth: 480 }}>
            Notez un nom, une photo, un lien. Vous voyez tout par défaut — sauf ce que l'autre a
            décidé de garder en surprise pour vous.
          </p>
        </header>

        {identityLoaded && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              background: PALETTE.card,
              border: `1px solid ${PALETTE.line}`,
              borderRadius: 12,
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: 13,
            }}
          >
            <span style={{ color: PALETTE.sub }}>Tu es :</span>
            {people.map((p) => {
              const active = currentUser === p;
              const theme = themeFor(p);
              return (
                <button
                  key={p}
                  onClick={() => startPickPerson(p)}
                  style={{
                    border: `1px solid ${active ? theme.main : PALETTE.line}`,
                    borderRadius: 999,
                    padding: "5px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: active ? theme.main : "transparent",
                    color: active ? "#fff" : PALETTE.ink,
                  }}
                >
                  {p}
                </button>
              );
            })}
            {currentUser && !identityWarning && (
              <span style={{ color: PALETTE.sub, fontSize: 12, marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                Réglage gardé sur cet appareil uniquement
                <button
                  type="button"
                  onClick={() => persistIdentity(null)}
                  style={{ background: "transparent", border: "none", color: PALETTE.rose, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                >
                  Changer
                </button>
              </span>
            )}
            {identityWarning && (
              <span style={{ color: PALETTE.sub, fontSize: 12, marginLeft: "auto" }}>
                Choix pris en compte pour cette session (non mémorisé pour la prochaine visite)
              </span>
            )}
          </div>
        )}

        {pendingPerson && (
          <form
            onSubmit={submitCode}
            style={{
              background: PALETTE.card,
              border: `1px solid ${PALETTE.line}`,
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 20,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, color: PALETTE.ink, fontWeight: 600 }}>
              {codeMode === "create"
                ? `Crée un code à 4 chiffres pour ${pendingPerson}`
                : `Entre le code de ${pendingPerson}`}
            </div>
            {codeMode === "create" && (
              <div style={{ fontSize: 12, color: PALETTE.sub, marginTop: -4 }}>
                Ce code te sera redemandé à chaque fois que tu choisiras ce profil, pour que l'autre
                ne puisse pas voir tes surprises.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                pattern="\d*"
                maxLength={4}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Code"
                style={{ ...inputStyle, marginTop: 0, width: 90, letterSpacing: 4, textAlign: "center" }}
              />
              {codeMode === "create" && (
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={4}
                  value={codeConfirmInput}
                  onChange={(e) => setCodeConfirmInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Confirme"
                  style={{ ...inputStyle, marginTop: 0, width: 90, letterSpacing: 4, textAlign: "center" }}
                />
              )}
            </div>
            {codeError && <div style={{ fontSize: 12, color: PALETTE.rose }}>{codeError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={cancelCodeEntry}
                style={{ background: "transparent", border: "none", color: PALETTE.sub, fontSize: 13, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{
                  background: PALETTE.ink,
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {codeMode === "create" ? "Créer le code" : "Valider"}
              </button>
            </div>
          </form>
        )}

        {identityLoaded && !currentUser && (
          <div
            style={{
              background: PALETTE.roseSoft,
              color: PALETTE.rose,
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Choisis qui tu es ci-dessus pour que les cadeaux surprise te soient bien cachés.
          </div>
        )}

        {error && (
          <div style={{ background: "#FBEAE8", color: PALETTE.rose, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
          <button
            onClick={() => setShowForm((s) => !s)}
            style={{
              background: PALETTE.ink,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "9px 16px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <Plus size={15} /> Ajouter une idée
          </button>

          {people.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: 4 }}>
              {["Tous", ...people].map((p) => {
                const active = filter === p;
                const theme = p === "Tous" ? { main: PALETTE.ink, soft: "#EFEAE1" } : themeFor(p);
                return (
                  <button
                    key={p}
                    onClick={() => setFilter(p)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      background: active ? theme.main : theme.soft,
                      color: active ? "#fff" : theme.main,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            style={{
              background: PALETTE.card,
              border: `1px solid ${PALETTE.line}`,
              borderRadius: 14,
              padding: 18,
              marginBottom: 24,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: PALETTE.sub }}>Nom du cadeau *</label>
                <input
                  required
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex. Enceinte Bluetooth"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: PALETTE.sub }}>Pour qui *</label>
                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  {people.map((p) => {
                    const active = form.pour === p;
                    const theme = themeFor(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, pour: p })}
                        style={{
                          border: `1px solid ${active ? theme.main : PALETTE.line}`,
                          borderRadius: 8,
                          padding: "8px 10px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: active ? theme.main : "#FEFDFB",
                          color: active ? "#fff" : PALETTE.ink,
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  {addingPerson ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        autoFocus
                        value={newPerson}
                        onChange={(e) => setNewPerson(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPerson();
                          }
                        }}
                        placeholder="Prénom"
                        style={{ ...inputStyle, marginTop: 0, width: 100, padding: "7px 8px" }}
                      />
                      <button
                        type="button"
                        onClick={handleAddPerson}
                        style={{
                          border: "none",
                          borderRadius: 8,
                          padding: "0 10px",
                          background: PALETTE.ink,
                          color: "#fff",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingPerson(true)}
                      title="Ajouter quelqu'un"
                      style={{
                        border: `1px dashed ${PALETTE.line}`,
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 13,
                        cursor: "pointer",
                        background: "transparent",
                        color: PALETTE.sub,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <UserPlus size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: PALETTE.sub, display: "flex", alignItems: "center", gap: 4 }}>
                <ImageIcon size={12} /> Photo (depuis ton téléphone)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoPick(e.target.files && e.target.files[0])}
                style={{ ...inputStyle, padding: "6px 8px" }}
              />
              {photoBusy && (
                <div style={{ fontSize: 11, color: PALETTE.sub, marginTop: 4 }}>Traitement de la photo...</div>
              )}
              {form.photo && !photoBusy && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <img
                    src={form.photo}
                    alt="Aperçu"
                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: `1px solid ${PALETTE.line}` }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photo: "" })}
                    style={{ background: "transparent", border: "none", color: PALETTE.sub, fontSize: 12, cursor: "pointer" }}
                  >
                    Retirer la photo
                  </button>
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 12, color: PALETTE.sub, display: "flex", alignItems: "center", gap: 4 }}>
                <LinkIcon size={12} /> Lien vers le produit
              </label>
              <input
                value={form.lien}
                onChange={(e) => setForm({ ...form, lien: e.target.value })}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: PALETTE.sub }}>Note (couleur, taille, pourquoi...)</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: PALETTE.ink, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!form.visible}
                onChange={(e) => setForm({ ...form, visible: !e.target.checked })}
              />
              Garder la surprise (caché à {form.pour || "la personne concernée"})
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ background: "transparent", border: "none", color: PALETTE.sub, fontSize: 13, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{
                  background: PALETTE.rose,
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ajouter à la liste
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ color: PALETTE.sub, fontSize: 14 }}>Chargement...</div>
        ) : visible.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: PALETTE.sub,
              border: `1px dashed ${PALETTE.line}`,
              borderRadius: 14,
            }}
          >
            <Gift size={26} style={{ marginBottom: 8, opacity: 0.6 }} />
            <div style={{ fontSize: 14 }}>Aucune idée pour l'instant. Ajoutez la première !</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {visible.map((item) => (
              <GiftTag
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onToggleVisible={handleToggleVisible}
                onOpenPhoto={(src, titre) => setLightbox({ src, titre })}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label={lightbox.titre}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30,26,22,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
            cursor: "zoom-out",
          }}
        >
          <img
            src={lightbox.src}
            alt={lightbox.titre}
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              borderRadius: 10,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          />
          <div style={{ color: "#fff", marginTop: 14, fontSize: 15, fontFamily: "Georgia, serif" }}>
            {lightbox.titre}
          </div>
          <button
            onClick={() => setLightbox(null)}
            aria-label="Fermer"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              background: "rgba(255,255,255,0.12)",
              border: "none",
              color: "#fff",
              borderRadius: 999,
              width: 34,
              height: 34,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${PALETTE.line}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  marginTop: 4,
  fontFamily: "inherit",
  color: PALETTE.ink,
  background: "#FEFDFB",
};
