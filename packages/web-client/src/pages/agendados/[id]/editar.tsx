/**
 * Edit Scheduled Post Page
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import DefaultLayout from "@/components/DefaultLayout";
import { api, useStore } from "@/lib/store";
import { CITIES, CATEGORIES } from "@/lib/config";

const REGIONS = CITIES.map(c => ({ value: c.code, label: `${c.name}, ${c.state}` }));

export default function EditScheduledPost() {
  const router = useRouter();
  const { id } = router.query;
  const { identity } = useStore();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id && identity) {
      loadPost();
    }
  }, [id, identity]);

  async function loadPost() {
    try {
      const result = await api.getScheduledPost(id as string);
      if (result.post) {
        setTitle(result.post.title);
        setBody(result.post.body);
        setRegion(result.post.region);
        setCategory(result.post.category || "");
        
        const date = new Date(result.post.publishAt);
        setScheduledDate(date.toISOString().split("T")[0]);
        setScheduledTime(date.toTimeString().slice(0, 5));
      }
    } catch (err: any) {
      setError("Erro ao carregar post");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title || !body) {
      setError("Título e conteúdo são obrigatórios");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const publishAt = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
      
      await api.updateScheduledPost(id as string, {
        title,
        body,
        region,
        category,
        publishAt,
      });

      router.push("/agendados");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!identity) {
    return (
      <DefaultLayout>
        <div className="text-center py-12">
          <p>Login necessário</p>
          <Link href="/login" className="text-primary">Entrar</Link>
        </div>
      </DefaultLayout>
    );
  }

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout maxWidth="lg">
      <Head>
        <title>Editar Post Agendado - Iceberg</title>
      </Head>

      <div className="mb-6">
        <Link href="/agendados" className="text-secondary hover:text-primary text-sm">
          ← Voltar para Agendados
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">✏️ Editar Post Agendado</h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div className="bg-surface rounded-xl p-5 border border-gray-800">
          <label className="block text-sm font-medium text-secondary mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Body */}
        <div className="bg-surface rounded-xl p-5 border border-gray-800">
          <label className="block text-sm font-medium text-secondary mb-2">Conteúdo</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full bg-background border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Region & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-secondary mb-2">Região</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
            >
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-surface rounded-xl p-5 border border-gray-800">
            <label className="block text-sm font-medium text-secondary mb-2">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
            >
              <option value="">Selecionar...</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-surface rounded-xl p-5 border border-gray-800">
          <label className="block text-sm font-medium text-secondary mb-2">📅 Data e Hora</label>
          <div className="flex gap-3">
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="flex-1 bg-background border border-gray-700 rounded-lg px-3 py-2"
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="bg-background border border-gray-700 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "💾 Salvar Alterações"}
          </button>
          <Link
            href="/agendados"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-center"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </DefaultLayout>
  );
}
