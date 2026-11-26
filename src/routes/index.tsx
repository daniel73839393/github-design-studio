import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Copy, Check, ExternalLink, Link2, UserRound, Palette } from "lucide-react";

type LinkItem = { id: string; title: string; url: string };
type Profile = { name: string; username: string; bio: string; avatar: string; color: string; style: "solid" | "outline" | "soft"; links: LinkItem[] };

const initial: Profile = {
  name: "Seu nome",
  username: "@seuusuario",
  bio: "Compartilhe um pouco sobre você e seus principais links.",
  avatar: "",
  color: "#c4a1ff",
  style: "solid",
  links: [
    { id: "a", title: "Instagram", url: "https://instagram.com/" },
    { id: "b", title: "TikTok", url: "https://tiktok.com/" },
    { id: "c", title: "Meu portfólio", url: "https://example.com/" },
  ],
};

function validUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch { return ""; }
}

export const Route = createFileRoute("/")({ component: LinkStudio });

function LinkStudio() {
  const [profile, setProfile] = useState<Profile>(initial);
  const [section, setSection] = useState<"profile" | "links" | "style">("profile");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const shared = new URLSearchParams(location.hash.slice(1)).get("profile");
      if (shared) setProfile({ ...initial, ...JSON.parse(decodeURIComponent(shared)) });
      else {
        const saved = localStorage.getItem("linkstudio-profile");
        if (saved) setProfile({ ...initial, ...JSON.parse(saved) });
      }
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("linkstudio-profile", JSON.stringify(profile));
  }, [profile]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin + window.location.pathname + "#profile=" + encodeURIComponent(JSON.stringify(profile));
  }, [profile]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile(p => ({ ...p, [key]: value }));
  const editLink = (id: string, key: "title" | "url", value: string) => set("links", profile.links.map(l => l.id === id ? { ...l, [key]: value } : l));
  const move = (index: number, delta: number) => {
    const next = [...profile.links]; const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]; set("links", next);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt("Copie o link do seu cartão:", shareUrl); }
  };

  return (
    <main className="min-h-screen bg-[#0d0b12] text-white">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <header className="mb-12 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 text-xl font-black tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl text-black" style={{ background: profile.color }}><Link2 /></span>link<span style={{ color: profile.color }}>studio</span></a>
          <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/50">Seu cartão digital</span>
        </header>
        <div className="mb-9 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.25em]" style={{ color: profile.color }}>Sua presença, em um só lugar</p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">Todos os seus links.<br/><span className="text-white/40">Do seu jeito.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">Monte uma página pessoal, personalize cada detalhe e compartilhe seu cartão com um único endereço.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_370px]">
          <section className="rounded-3xl border border-white/10 bg-[#17141f] p-4 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Editor do cartão</h2><p className="mt-1 text-xs text-white/40">Personalize e acompanhe a prévia.</p></div><button onClick={copy} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-black" style={{ background: profile.color }}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Copiado!" : "Compartilhar"}</button></div>
            <nav className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-black/25 p-1">
              {([{id:"profile",label:"Perfil",icon:UserRound},{id:"links",label:"Links",icon:Link2},{id:"style",label:"Aparência",icon:Palette}] as const).map(item => <button key={item.id} onClick={() => setSection(item.id)} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold ${section === item.id ? "bg-white/10 text-white" : "text-white/45"}`}><item.icon size={16}/>{item.label}</button>)}
            </nav>
            {section === "profile" && <div className="space-y-4">
              <Field label="Nome" value={profile.name} onChange={v => set("name",v)} placeholder="Seu nome"/>
              <Field label="Usuário" value={profile.username} onChange={v => set("username",v)} placeholder="@seuusuario"/>
              <div><label className="mb-2 block text-xs font-semibold text-white/60">Biografia</label><textarea value={profile.bio} maxLength={180} onChange={e => set("bio",e.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-white/30"/><p className="mt-1 text-right text-[11px] text-white/30">{profile.bio.length}/180</p></div>
              <Field label="URL da foto de perfil" value={profile.avatar} onChange={v => set("avatar",v)} placeholder="https://..."/>
            </div>}
            {section === "links" && <div className="space-y-4">
              <div className="flex items-center justify-between"><div><h3 className="font-bold">Seus botões</h3><p className="text-xs text-white/40">Adicione, remova e reordene.</p></div><button onClick={() => set("links",[...profile.links,{id:crypto.randomUUID(),title:"Novo link",url:"https://"}])} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"><Plus size={15}/>Adicionar link</button></div>
              {profile.links.map((link,i) => <div key={link.id} className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-white/40">LINK {i+1}</span><div className="flex gap-1"><button aria-label="Mover para cima" disabled={i===0} onClick={() => move(i,-1)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 disabled:opacity-20"><ArrowUp size={15}/></button><button aria-label="Mover para baixo" disabled={i===profile.links.length-1} onClick={() => move(i,1)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 disabled:opacity-20"><ArrowDown size={15}/></button><button aria-label="Excluir link" onClick={() => set("links",profile.links.filter(x=>x.id!==link.id))} className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10"><Trash2 size={15}/></button></div></div><div className="space-y-3"><Field label="Título do botão" value={link.title} onChange={v=>editLink(link.id,"title",v)}/><Field label="URL" value={link.url} onChange={v=>editLink(link.id,"url",v)} placeholder="https://..."/></div></div>)}
              {profile.links.length===0 && <p className="rounded-xl border border-dashed border-white/15 p-7 text-center text-sm text-white/40">Adicione seu primeiro link.</p>}
            </div>}
            {section === "style" && <div className="space-y-6"><div><label className="mb-3 block text-xs font-semibold text-white/60">Cor principal</label><div className="flex flex-wrap gap-3">{["#c4a1ff","#f9a8d4","#7dd3fc","#86efac","#fcd34d","#fb7185","#ffffff"].map(c=><button key={c} aria-label={c} onClick={()=>set("color",c)} className={`h-10 w-10 rounded-full border-2 ${profile.color===c?"border-white scale-110":"border-white/15"}`} style={{background:c}}/>)}<input aria-label="Escolher cor personalizada" type="color" value={profile.color} onChange={e=>set("color",e.target.value)} className="h-10 w-10 cursor-pointer rounded-full bg-transparent"/></div></div><div><label className="mb-3 block text-xs font-semibold text-white/60">Estilo dos botões</label><div className="grid grid-cols-3 gap-2">{(["solid","outline","soft"] as const).map(s=><button key={s} onClick={()=>set("style",s)} className={`rounded-xl border px-3 py-3 text-xs font-bold ${profile.style===s?"border-white/40 bg-white/10":"border-white/10 text-white/50"}`}>{s==="solid"?"Sólido":s==="outline"?"Contorno":"Suave"}</button>)}</div></div></div>}
          </section>
          <aside className="lg:sticky lg:top-6 lg:self-start"><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold">Prévia ao vivo</h2><span className="text-xs text-white/35">Mobile</span></div><div className="rounded-[2rem] border border-white/10 bg-[#17141f] p-3 shadow-2xl"><div className="min-h-[560px] rounded-[1.5rem] bg-[#0a0910] px-5 py-10"><div className="mx-auto flex max-w-xs flex-col items-center text-center">{profile.avatar && validUrl(profile.avatar) ? <img src={validUrl(profile.avatar)} alt="Avatar" className="mb-4 h-24 w-24 rounded-full border-2 object-cover" style={{borderColor:profile.color}}/> : <div className="mb-4 grid h-24 w-24 place-items-center rounded-full bg-white/5" style={{color:profile.color}}><UserRound size={38}/></div>}<h3 className="break-words text-xl font-black">{profile.name || "Seu nome"}</h3><p className="mt-1 text-xs text-white/40">{profile.username}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/65">{profile.bio}</p><div className="mt-7 flex w-full flex-col gap-3">{profile.links.map(l=><a key={l.id} href={validUrl(l.url)||undefined} target="_blank" rel="noreferrer" onClick={e=>{if(!validUrl(l.url))e.preventDefault()}} className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5" style={{background:profile.style==="solid"?profile.color:profile.style==="soft"?profile.color+"22":"transparent",border:profile.style==="outline"?"1px solid "+profile.color:"1px solid transparent",color:profile.style==="solid"?"#17131f":"white"}}>{l.title||"Seu link"}<ExternalLink size={14}/></a>)}</div><p className="mt-10 text-[10px] font-bold tracking-[.2em] text-white/20">FEITO COM LINKSTUDIO</p></div></div></div><button onClick={copy} className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold hover:bg-white/10">Copiar link compartilhável</button><p className="mt-3 text-center text-[11px] leading-5 text-white/35">Seu cartão fica salvo neste navegador. O link carrega uma cópia dos dados do seu perfil.</p></aside>
        </div>
        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-white/30">Link Studio · Seu cartão, suas regras.</footer>
      </div>
    </main>
  );
}

function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}) {
  return <div><label className="mb-2 block text-xs font-semibold text-white/60">{label}</label><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"/></div>;
}
