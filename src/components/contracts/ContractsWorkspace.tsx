"use client";

import Link from "next/link";
import { ArrowLeft, FileSignature, Paperclip, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ContractService } from "@/services/contract.service";
import { ProjectService } from "@/services/project.service";
import type { Contract, ContractStatus } from "@/types/document";
import type { Project } from "@/types/project";

const labels: Record<ContractStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default function ContractsWorkspace({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [items, setItems] = useState<Contract[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProject(ProjectService.findById(projectId) ?? null);
    setItems(ContractService.findByProject(projectId));
    setInitialized(true);
  }, [projectId]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const selectedFile = fileRef.current?.files?.[0] ?? null;

    setBusy(true);
    setError("");

    try {
      await ContractService.create({
        projectId,
        title: String(form.get("title") || ""),
        contractor: String(form.get("contractor") || ""),
        client: String(form.get("client") || ""),
        amount: Number(form.get("amount") || 0),
        startDate: String(form.get("startDate") || ""),
        endDate: String(form.get("endDate") || ""),
        status: String(form.get("status") || "draft") as ContractStatus,
        notes: String(form.get("notes") || ""),
        file: selectedFile,
      });

      setItems(ContractService.findByProject(projectId));
      formElement.reset();
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error("Error al registrar el contrato:", err);
      setError("No se pudo registrar el contrato. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este contrato?")) return;
    await ContractService.delete(id);
    setItems(ContractService.findByProject(projectId));
  }

  async function openAttachment(id: string) {
    const opened = await ContractService.openAttachment(id);
    if (!opened) setError("No se encontró el documento adjunto de este contrato.");
  }

  if (!initialized) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
        <div className="mx-auto max-w-6xl text-sm text-slate-500">Cargando proyecto...</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
        <div className="mx-auto max-w-6xl">Proyecto no encontrado.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al proyecto
        </Link>

        <p className="mt-6 text-sm font-semibold text-blue-600">{project.name}</p>
        <h1 className="mt-1 text-3xl font-bold">Contratos</h1>
        <p className="mt-2 text-slate-500">
          Administra contratos vinculados al proyecto, sus montos, fechas, estado y documento adjunto.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
        >
          <Field name="title" label="Nombre del contrato *" required />
          <Field name="contractor" label="Contratista / proveedor *" required />
          <Field name="client" label="Cliente / contratante" defaultValue={project.client} />
          <Field name="amount" label="Monto RD$" type="number" />
          <Field name="startDate" label="Fecha de inicio" type="date" />
          <Field name="endDate" label="Fecha de término" type="date" />

          <div>
            <label className="text-sm font-semibold">Estado</label>
            <select name="status" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3">
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Documento</label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*,.doc,.docx"
              className="mt-2 block w-full rounded-xl border border-slate-200 p-2.5 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold">Notas / alcance</label>
            <textarea name="notes" rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" />
          </div>

          {error && <p className="md:col-span-2 text-sm font-medium text-red-600">{error}</p>}

          <div className="md:col-span-2">
            <button
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              <FileSignature className="h-5 w-5" />
              {busy ? "Guardando..." : "Registrar contrato"}
            </button>
          </div>
        </form>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Contratos registrados <span className="text-slate-400">({items.length})</span>
          </h2>

          {items.length === 0 ? (
            <div className="py-14 text-center text-slate-500">
              <FileSignature className="mx-auto mb-3 h-10 w-10" />
              Aún no hay contratos para este proyecto.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {items.map((x) => (
                <article key={x.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{x.title}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{labels[x.status]}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{x.contractor} · {x.client}</p>
                      <p className="mt-1 text-sm text-slate-500">{x.startDate || "Sin fecha"} → {x.endDate || "Sin fecha"}</p>
                      {x.notes && <p className="mt-2 text-sm text-slate-600">{x.notes}</p>}
                    </div>

                    <div className="sm:text-right">
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(x.amount)}
                      </p>
                      <div className="mt-3 flex gap-2 sm:justify-end">
                        {x.attachmentName && (
                          <button
                            type="button"
                            onClick={() => openAttachment(x.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:text-blue-600"
                          >
                            <Paperclip className="h-4 w-4" />
                            Abrir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(x.id)}
                          className="rounded-xl border border-slate-200 p-2 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}
