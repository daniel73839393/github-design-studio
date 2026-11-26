import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Trash2, ArrowUp, ArrowDown, Copy, Check, ExternalLink, Link2, UserRound,
  Palette, ImagePlus, Eye, Share2, QrCode, Sparkles, Type, Layout, Settings2,
  Instagram, Youtube, Music2, Github, Globe, Mail, MessageCircle, Upload, X,
  Smartphone, Monitor, ChevronLeft, CheckCircle2, AlertCircle
} from "lucide-react";

type LinkItem = { id: string; title: string; url: string; icon: string; enabled: boolean };
type Profile = {
  name: string; username: string; bio: string; avatar: string; color: string;
  buttonStyle: "solid" | "outline" | "soft" | "glass" | "gradient";
  backgroundType: "solid" | "gradient" | "image"; backgroundColor: string;
  gradientStart: string; gradientEnd: string; gradientDirection: string;
  backgroundImage: string; backgroundPosition: string; overlay: number;
  font: string; textColor: string; radius: number; alignment: "center" | "left";
  theme: string; links: LinkItem[];
};
const initial: Profile = {
  name: "Seu nome", username: "@seuusuario",
  bio: "Compartilhe um pouco sobre você e seus principais links.",
  avatar: "", color: "#c4a1ff", buttonStyle: "solid",
  backgroundType: "solid", backgroundColor: "#111018",
  gradientStart: "#251b3d", gradientEnd: "#09090f", gradientDirection: "135deg",
  backgroundImage: "", backgroundPosition: "center", overlay: 35,
  font: "Inter", textColor: "#ffffff", radius: 16, alignment: "center", theme: "custom",
  links: [
    { id: "a", title: "Instagram", url: "https://instagram.com/", icon: "instagram", enabled: true },
    { id: "b", title: "TikTok", url: "https://tiktok.com/", icon: "music", enabled: true },
    { id: "c", title: "Meu portfólio", url: "https://example.com/", icon: "globe", enabled: true }
  ]
};
const palettes = [
  { name: "Lavanda", color: "#c4a1ff", bg: "#111018", start: "#251b3d", end: "#09090f" },
  { name: "Rosa", color: "#f9a8d4", bg: "#1b1019", start: "#54223f", end: "#130b16" },
  { name: "Oceano", color: "#7dd3fc", bg: "#0b1720", start: "#123c55", end: "#071018" },
  { name: "Natureza", color: "#86efac", bg: "#101b15", start: "#1e4930", end: "#09130d" },
  { name: "Solar", color: "#fcd34d", bg: "#1d180d", start: "#59421b", end: "#120e08" },
  { name: "Cereja", color: "#fb7185", bg: "#1c0e13", start: "#57202d", end: "#10090d" },
  { name: "Minimal", color: "#ffffff", bg: "#111111", start: "#333333", end: "#080808" }
];
const iconOptions = ["globe", "instagram", "youtube", "music", "github", "mail", "message"];
function validUrl(value: string) {
  try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:" ? u.href : ""; }
  catch { return ""; }
}
function readSharedProfile(): Profile | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("data");
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw));
    return { ...initial, ...parsed, links: Array.isArray(parsed.links) ? parsed.links : initial.links };
  } catch { return null; }
}
function iconFor(name: string, size = 17) {
  const props = { size, strokeWidth: 1.8 };
  if (name === "instagram") return <Instagram {...props}/>;
  if (name === "youtube") return <Youtube {...props}/>;
  if (name === "music") return <Music2 {...props}/>;
  if (name === "github") return <Github {...props}/>;
  if (name === "mail") return <Mail {...props}/>;
  if (name === "message") return <MessageCircle {...props}/>;
  return <Globe {...props}/>;
}
export const Route = createFileRoute("/")({ component: LinkStudio });

function LinkStudio() {
  const [profile, setProfile] = useState<Profile>(initial);
  const [section, setSection] = useState("profile");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shared = readSharedProfile();
    const publicMode = new URLSearchParams(window.location.search).get("view") === "1" && !!shared;
    setIsPublic(publicMode);
    if (shared) setProfile(shared);
    else {
      try {
        const local = localStorage.getItem("linkstudio-profile-v2");
        if (local) setProfile({ ...initial, ...JSON.parse(local) });
      } catch { /* keep defaults */ }
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || isPublic) return;
    try { localStorage.setItem("linkstudio-profile-v2", JSON.stringify(profile)); setSaved(true); }
    catch { setSaved(false); }
  }, [profile, loaded, isPublic]);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const payload = encodeURIComponent(JSON.stringify(profile));
    return window.location.origin + window.location.pathname + "?view=1&data=" + payload;
  }, [profile]);
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=" + encodeURIComponent(publicUrl);
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile(p => ({ ...p, [key]: value }));
  const editLink = (id: string, key: "title" | "url" | "icon" | "enabled", value: string | boolean) =>
    setProfile(p => ({ ...p, links: p.links.map(l => l.id === id ? { ...l, [key]: value } : l) }));
  const moveLink = (index: number, delta: number) => setProfile(p => {
    const next = [...p.links]; const target = index + delta;
    if (target < 0 || target >= next.length) return p;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...p, links: next };
  });
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt("Copie o endereço do seu cartão:", publicUrl); }
  };
  const visitCard = () => window.open(publicUrl, "_blank", "noopener,noreferrer");
  const uploadImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { window.alert("Escolha um arquivo de imagem."); return; }
    if (file.size > 2 * 1024 * 1024) { window.alert("A imagem deve ter no máximo 2 MB para manter o cartão compartilhável."); return; }
    const reader = new FileReader();
    reader.onload = () => update("backgroundImage", String(reader.result || ""));
    reader.readAsDataURL(file);
  };
  const applyTheme = (theme: typeof palettes[number]) => setProfile(p => ({
    ...p, theme: theme.name, color: theme.color, backgroundColor: theme.bg,
    gradientStart: theme.start, gradientEnd: theme.end, backgroundType: "gradient",
    buttonStyle: "solid", textColor: "#ffffff"
  }));
  const bgStyle: React.CSSProperties = profile.backgroundType === "image" && profile.backgroundImage
    ? { backgroundImage: "linear-gradient(rgba(0,0,0," + (profile.overlay / 100) + "),rgba(0,0,0," + (profile.overlay / 100) + ")),url(" + profile.backgroundImage + ")", backgroundSize: "cover", backgroundPosition: profile.backgroundPosition }
    : profile.backgroundType === "gradient"
      ? { background: "linear-gradient(" + profile.gradientDirection + "," + profile.gradientStart + "," + profile.gradientEnd + ")" }
      : { background: profile.backgroundColor };
  const publicMode = isPublic;

  return publicMode ? (
    <main className="min-h-screen px-5 py-12" style={{ ...bgStyle, color: profile.textColor, fontFamily: profile.font }}>
      <div className="mx-auto flex min-h-[75vh] w-full max-w-md flex-col items-center justify-center text-center">
        <CardContent profile={profile} publicMode/>
        <a href="/" className="mt-12 text-[10px] font-semibold tracking-[.18em] text-white/35 hover:text-white/70">CRIAR MEU CARTÃO · LINK STUDIO</a>
      </div>
    </main>
  ) : (
    <main className="min-h-screen bg-[#0b0a10] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-7">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <a href="/" className="flex items-center gap-3 text-xl font-black tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl text-black" style={{background:profile.color}}><Link2/></span>link<span style={{color:profile.color}}>studio</span></a>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 hidden items-center gap-1.5 text-xs text-white/40 sm:flex">{saved ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {saved ? "Alterações salvas neste dispositivo" : "Salvamento local indisponível"}</span>
            <button onClick={visitCard} className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold hover:bg-white/10"><Eye size={16}/>Visitar cartão</button>
            <button onClick={copyLink} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black" style={{background:profile.color}}>{copied ? <Check size={16}/> : <Share2 size={16}/>} {copied ? "Link copiado" : "Compartilhar"}</button>
          </div>
        </header>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.25em]" style={{color:profile.color}}>Sua presença, em um só lugar</p><h1 className="text-3xl font-black sm:text-4xl">Crie seu cartão digital.</h1><p className="mt-2 text-sm text-white/45">Personalize sua identidade e compartilhe com o mundo.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-white/45"><Sparkles size={14} style={{color:profile.color}}/> Editor visual</div>
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0 rounded-3xl border border-white/10 bg-[#15131c] p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Personalizar cartão</h2><p className="mt-1 text-xs text-white/40">As alterações aparecem instantaneamente na prévia.</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">Editor ativo</span></div>
            <nav className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-black/30 p-1 sm:grid-cols-6">
              {[
                {id:"profile",label:"Perfil",icon:<UserRound size={15}/>},
                {id:"links",label:"Links",icon:<Link2 size={15}/>},
                {id:"background",label:"Fundo",icon:<ImagePlus size={15}/>},
                {id:"style",label:"Botões",icon:<Palette size={15}/>},
                {id:"typography",label:"Texto",icon:<Type size={15}/>},
                {id:"themes",label:"Temas",icon:<Sparkles size={15}/>}
              ].map(item => <button key={item.id} onClick={()=>setSection(item.id)} className={"flex items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold transition " + (section===item.id ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80")}>{item.icon}{item.label}</button>)}
            </nav>

            {section === "profile" && <div className="space-y-4">
              <Field label="Nome de exibição" value={profile.name} onChange={v=>update("name",v)} placeholder="Seu nome"/>
              <Field label="Nome de usuário" value={profile.username} onChange={v=>update("username",v)} placeholder="@seuusuario"/>
              <div><Label>Biografia</Label><textarea value={profile.bio} maxLength={180} onChange={e=>update("bio",e.target.value)} rows={3} className="control w-full resize-y"/><p className="mt-1 text-right text-[11px] text-white/30">{profile.bio.length}/180</p></div>
              <Field label="URL da foto de perfil" value={profile.avatar} onChange={v=>update("avatar",v)} placeholder="https://..."/>
              <p className="text-xs text-white/35">Dica: use uma imagem pública em HTTPS para sua foto de perfil.</p>
            </div>}

            {section === "links" && <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Seus links</h3><p className="text-xs text-white/40">Adicione, edite, oculte ou reorganize seus botões.</p></div><button onClick={()=>update("links",[...profile.links,{id:crypto.randomUUID(),title:"Novo link",url:"https://",icon:"globe",enabled:true}])} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-black" style={{background:profile.color}}><Plus size={15}/>Adicionar link</button></div>
              {profile.links.map((link,i)=><div key={link.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold text-white/45">LINK {i+1}<span className={link.enabled?"text-emerald-300":"text-white/25"}>{link.enabled?"· Visível":"· Oculto"}</span></div><div className="flex gap-1">
                  <button title="Mover para cima" disabled={i===0} onClick={()=>moveLink(i,-1)} className="icon-button"><ArrowUp size={15}/></button><button title="Mover para baixo" disabled={i===profile.links.length-1} onClick={()=>moveLink(i,1)} className="icon-button"><ArrowDown size={15}/></button><button title="Excluir link" onClick={()=>update("links",profile.links.filter(x=>x.id!==link.id))} className="icon-button text-rose-300"><Trash2 size={15}/></button>
                </div></div>
                <div className="grid gap-3 sm:grid-cols-2"><Field label="Título do botão" value={link.title} onChange={v=>editLink(link.id,"title",v)}/><Field label="Endereço (URL)" value={link.url} onChange={v=>editLink(link.id,"url",v)} placeholder="https://..."/></div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Label>Ícone</Label><select className="control py-2" value={link.icon} onChange={e=>editLink(link.id,"icon",e.target.value)}>{iconOptions.map(x=><option key={x} value={x}>{x}</option>)}</select></div><label className="flex items-center gap-2 text-xs text-white/55"><input type="checkbox" checked={link.enabled} onChange={e=>editLink(link.id,"enabled",e.target.checked)}/> Mostrar no cartão</label></div>
                {link.url && link.url !== "https://" && !validUrl(link.url) && <p className="mt-2 text-[11px] text-amber-300">Insira um endereço válido começando com http:// ou https://.</p>}
              </div>)}
              {profile.links.length===0 && <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><Link2 className="mx-auto mb-3 text-white/30"/><p className="text-sm text-white/55">Seu cartão ainda não tem links.</p><button onClick={()=>update("links",[{id:crypto.randomUUID(),title:"Meu site",url:"https://",icon:"globe",enabled:true}])} className="mt-3 text-sm font-bold" style={{color:profile.color}}>Adicionar primeiro link</button></div>}
            </div>}

            {section === "background" && <div className="space-y-6">
              <div><Label>Tipo de plano de fundo</Label><div className="grid grid-cols-3 gap-2">{[{id:"solid",label:"Cor sólida"},{id:"gradient",label:"Gradiente"},{id:"image",label:"Imagem"}].map(x=><button key={x.id} onClick={()=>update("backgroundType",x.id as Profile["backgroundType"])} className={"rounded-xl border px-3 py-3 text-xs font-bold " + (profile.backgroundType===x.id?"border-white/40 bg-white/10":"border-white/10 text-white/50")}>{x.label}</button>)}</div></div>
              {profile.backgroundType==="solid" && <ColorField label="Cor do fundo" value={profile.backgroundColor} onChange={v=>update("backgroundColor",v)}/>}
              {profile.backgroundType==="gradient" && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><ColorField label="Cor inicial" value={profile.gradientStart} onChange={v=>update("gradientStart",v)}/><ColorField label="Cor final" value={profile.gradientEnd} onChange={v=>update("gradientEnd",v)}/></div><div><Label>Direção do gradiente</Label><select className="control w-full" value={profile.gradientDirection} onChange={e=>update("gradientDirection",e.target.value)}><option value="0deg">Vertical</option><option value="90deg">Horizontal</option><option value="135deg">Diagonal</option><option value="225deg">Diagonal inversa</option></select></div></div>}
              {profile.backgroundType==="image" && <div className="space-y-4"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>uploadImage(e.target.files?.[0])}/><button onClick={()=>fileRef.current?.click()} className="flex w-full flex-col items-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-7 text-center hover:bg-white/[.04]"><Upload className="mb-2 text-white/55"/><span className="text-sm font-bold">Enviar imagem do dispositivo</span><span className="mt-1 text-xs text-white/35">PNG, JPG ou WebP · máximo 2 MB</span></button><Field label="Ou use uma URL de imagem" value={profile.backgroundImage.startsWith("data:")?"":profile.backgroundImage} onChange={v=>update("backgroundImage",v)} placeholder="https://..."/>{profile.backgroundImage && <><div><Label>Posição da imagem</Label><select className="control w-full" value={profile.backgroundPosition} onChange={e=>update("backgroundPosition",e.target.value)}><option value="center">Centralizada</option><option value="top">Topo</option><option value="bottom">Base</option><option value="left">Esquerda</option><option value="right">Direita</option></select></div><div><Label>Intensidade da camada escura: {profile.overlay}%</Label><input type="range" min="0" max="85" value={profile.overlay} onChange={e=>update("overlay",Number(e.target.value))} className="w-full accent-white"/></div><button onClick={()=>update("backgroundImage","")} className="text-xs text-rose-300">Remover imagem</button></>}</div>}
              <button onClick={()=>setProfile(p=>({...p,backgroundType:"solid",backgroundColor:"#111018",backgroundImage:"",overlay:35}))} className="text-xs text-white/45 underline">Restaurar fundo original</button>
            </div>}

            {section === "style" && <div className="space-y-6">
              <div><Label>Estilo dos botões</Label><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[{id:"solid",label:"Sólido"},{id:"outline",label:"Contorno"},{id:"soft",label:"Suave"},{id:"glass",label:"Vidro"},{id:"gradient",label:"Gradiente"}].map(x=><button key={x.id} onClick={()=>update("buttonStyle",x.id as Profile["buttonStyle"])} className={"rounded-xl border px-3 py-3 text-xs font-bold " + (profile.buttonStyle===x.id?"border-white/40 bg-white/10":"border-white/10 text-white/50")}>{x.label}</button>)}</div></div>
              <ColorField label="Cor de destaque" value={profile.color} onChange={v=>update("color",v)}/>
              <ColorField label="Cor do texto dos botões" value={profile.textColor} onChange={v=>update("textColor",v)}/>
              <div><Label>Arredondamento dos botões: {profile.radius}px</Label><input type="range" min="0" max="32" value={profile.radius} onChange={e=>update("radius",Number(e.target.value))} className="w-full accent-white"/></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4"><Label>Exemplo de botão</Label><div className="mt-3 rounded-xl px-4 py-3 text-center text-sm font-bold" style={buttonCss(profile)}>Meu link de exemplo</div></div>
            </div>}

            {section === "typography" && <div className="space-y-5">
              <div><Label>Família tipográfica</Label><select className="control w-full" value={profile.font} onChange={e=>update("font",e.target.value)}><option>Inter</option><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Trebuchet MS</option><option>system-ui</option></select></div>
              <div><Label>Alinhamento do cartão</Label><div className="grid grid-cols-2 gap-2"><button onClick={()=>update("alignment","center")} className={"rounded-xl border p-3 text-xs " + (profile.alignment==="center"?"border-white/40 bg-white/10":"border-white/10")}>Centralizado</button><button onClick={()=>update("alignment","left")} className={"rounded-xl border p-3 text-xs " + (profile.alignment==="left"?"border-white/40 bg-white/10":"border-white/10")}>À esquerda</button></div></div>
              <ColorField label="Cor dos textos" value={profile.textColor} onChange={v=>update("textColor",v)}/>
            </div>}

            {section === "themes" && <div><h3 className="mb-1 font-bold">Escolha um ponto de partida</h3><p className="mb-4 text-xs text-white/40">Você pode continuar personalizando depois de aplicar um tema.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{palettes.map(theme=><button key={theme.name} onClick={()=>applyTheme(theme)} className={"overflow-hidden rounded-2xl border text-left transition " + (profile.theme===theme.name?"border-white/60":"border-white/10 hover:border-white/30")}><div className="h-20 p-3" style={{background:"linear-gradient(135deg,"+theme.start+","+theme.end)}}><div className="mx-auto mt-3 h-3 w-16 rounded-full" style={{background:theme.color}}/><div className="mx-auto mt-2 h-2 w-11 rounded-full bg-white/25"/></div><div className="flex items-center justify-between bg-white/[.04] px-3 py-2.5 text-xs font-semibold">{theme.name}{profile.theme===theme.name?<Check size={14}/>:null}</div></button>)}</div></div>}
          </section>

          <aside className="xl:sticky xl:top-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Pré-visualização</h2><p className="mt-1 text-[11px] text-white/35">Veja o resultado em tempo real.</p></div><div className="flex rounded-lg border border-white/10 p-1"><button onClick={()=>setMobilePreview(true)} className={"rounded-md p-2 "+(mobilePreview?"bg-white/10":"text-white/40")} title="Visualização mobile"><Smartphone size={15}/></button><button onClick={()=>setMobilePreview(false)} className={"rounded-md p-2 "+(!mobilePreview?"bg-white/10":"text-white/40")} title="Visualização desktop"><Monitor size={15}/></button></div></div>
            <div className={"mx-auto overflow-hidden rounded-[2rem] border border-white/10 bg-[#17141f] p-3 shadow-2xl transition-all "+(mobilePreview?"max-w-[390px]":"max-w-full")}><div className="flex min-h-[570px] items-center justify-center overflow-hidden rounded-[1.5rem] px-5 py-10" style={{...bgStyle,color:profile.textColor,fontFamily:profile.font}}><div className="w-full"><CardContent profile={profile}/></div></div></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={visitCard} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-3 text-xs font-bold hover:bg-white/10"><Eye size={15}/>Visitar cartão</button><button onClick={copyLink} className="flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold text-black" style={{background:profile.color}}><Copy size={15}/>Copiar endereço</button></div>
            <button onClick={()=>setShowQr(!showQr)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-3 text-xs font-semibold text-white/65 hover:bg-white/5"><QrCode size={15}/>{showQr?"Ocultar QR Code":"Gerar QR Code do cartão"}</button>
            {showQr && <div className="mt-3 rounded-2xl bg-white p-4 text-center"><img src={qrUrl} alt="QR Code do cartão" className="mx-auto h-[190px] w-[190px]"/><p className="mt-2 text-xs text-black/55">Escaneie para abrir o cartão público.</p></div>}
            <p className="mt-3 text-center text-[10px] leading-5 text-white/30">O editor salva neste navegador. O endereço compartilhável leva os dados do cartão para outros dispositivos.</p>
          </aside>
        </div>
        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-white/25">Link Studio · Seu cartão, suas regras.</footer>
      </div>
    </main>
  );
}

function buttonCss(profile: Profile): React.CSSProperties {
  const common: React.CSSProperties = { borderRadius: profile.radius, color: profile.buttonStyle==="solid" ? "#17131f" : profile.textColor, border: "1px solid transparent" };
  if (profile.buttonStyle==="outline") return {...common,background:"transparent",border:"1px solid "+profile.color};
  if (profile.buttonStyle==="soft") return {...common,background:profile.color+"28"};
  if (profile.buttonStyle==="glass") return {...common,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",backdropFilter:"blur(12px)"};
  if (profile.buttonStyle==="gradient") return {...common,background:"linear-gradient(100deg,"+profile.color+",#ffffff)",color:"#17131f"};
  return {...common,background:profile.color};
}
function CardContent({profile,publicMode=false}:{profile:Profile;publicMode?:boolean}) {
  const alignment = profile.alignment==="left" ? "items-start text-left" : "items-center text-center";
  return <div className={"mx-auto flex w-full max-w-xs flex-col "+alignment}>
    {profile.avatar && validUrl(profile.avatar) ? <img src={validUrl(profile.avatar)} alt={"Foto de "+profile.name} className="mb-4 h-24 w-24 rounded-full border-2 object-cover" style={{borderColor:profile.color}}/> : <div className="mb-4 grid h-24 w-24 place-items-center rounded-full bg-white/10" style={{color:profile.color}}><UserRound size={38}/></div>}
    <h1 className="max-w-full break-words text-2xl font-black">{profile.name || "Seu nome"}</h1>
    <p className="mt-1 text-xs opacity-60">{profile.username}</p>
    {profile.bio && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 opacity-80">{profile.bio}</p>}
    <div className="mt-7 flex w-full flex-col gap-3">{profile.links.filter(l=>l.enabled).map(link=><a key={link.id} href={validUrl(link.url)||undefined} target="_blank" rel="noopener noreferrer" onClick={e=>{if(!validUrl(link.url))e.preventDefault()}} className="flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition duration-200 hover:-translate-y-0.5" style={buttonCss(profile)}>{iconFor(link.icon,16)}<span className="min-w-0 break-words">{link.title || "Meu link"}</span><ExternalLink size={13} className="opacity-60"/></a>)}</div>
    {profile.links.filter(l=>l.enabled).length===0 && <p className="mt-7 text-xs opacity-45">Nenhum link disponível no momento.</p>}
    <p className="mt-10 text-[9px] font-bold tracking-[.22em] opacity-30">{publicMode?"LINK STUDIO":"SEU CARTÃO DIGITAL"}</p>
  </div>;
}
function Label({children}:{children:React.ReactNode}) { return <label className="mb-2 block text-xs font-semibold text-white/60">{children}</label>; }
function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}) {
  return <div><Label>{label}</Label><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="control w-full"/></div>;
}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) {
  return <div><Label>{label}</Label><div className="flex items-center gap-3"><input type="color" value={value.startsWith("#")&&value.length===7?value:"#ffffff"} onChange={e=>onChange(e.target.value)} className="h-11 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"/><input value={value} onChange={e=>onChange(e.target.value)} className="control flex-1" placeholder="#ffffff"/></div></div>;
}
