"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { useState } from "react";

import { ProjectService } from "@/services/project.service";

const projectTypes = [
  "Vivienda",
  "Edificio residencial",
  "Edificio comercial",
  "Remodelación",
  "Obra vial",
  "Obra hidráulica",
  "Otra",
];

export default function NewProjectForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [projectType, setProjectType] = useState("");

  const fieldsAreValid = Boolean(
    name.trim() &&
      client.trim() &&
      location.trim() &&
      projectType.trim(),
  );

  function saveProject() {
    if (!fieldsAreValid) return;

    const project = ProjectService.create({
      name,
      client,
      location,
      projectType,
    });

    router.push(`/projects/${project.id}`);
  }

  function goToNextStep() {
    setStep((currentStep) => Math.min(currentStep + 1, 4));
  }

  function goToPreviousStep() {
    setStep((currentStep) => Math.max(currentStep - 1, 1));
  }

  const currentStepIsValid =
    (step === 1 && Boolean(name.trim())) ||
    (step === 2 && Boolean(client.trim())) ||
    (step === 3 && Boolean(location.trim())) ||
    (step === 4 && Boolean(projectType.trim()));

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm font-semibold text-blue-600">
            Nuevo proyecto · Paso {step} de 4
          </p>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`h-2 rounded-full transition ${
                  item <= step ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <Step
              title="¿Cómo se llama el proyecto?"
              description="Utiliza un nombre fácil de identificar."
            >
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Residencial Vista Verde"
                className="nexus-input"
              />
            </Step>
          )}

          {step === 2 && (
            <Step
              title="¿Quién es el cliente?"
              description="Puede ser una persona, empresa o institución."
            >
              <input
                autoFocus
                value={client}
                onChange={(event) => setClient(event.target.value)}
                placeholder="Nombre del cliente"
                className="nexus-input"
              />
            </Step>
          )}

          {step === 3 && (
            <Step
              title="¿Dónde se realizará la obra?"
              description="Indica la ciudad, municipio o dirección general."
            >
              <input
                autoFocus
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ej. Santiago, República Dominicana"
                className="nexus-input"
              />
            </Step>
          )}

          {step === 4 && (
            <Step
              title="Selecciona el tipo de obra"
              description="Esto ayudará a NEXUS a organizar el presupuesto."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {projectTypes.map((type) => {
                  const selected = projectType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProjectType(type)}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left font-medium transition ${
                        selected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      {type}

                      {selected && <Check className="h-5 w-5" />}
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={goToPreviousStep}
              className="rounded-xl px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:invisible"
            >
              Anterior
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!currentStepIsValid}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={saveProject}
                disabled={!fieldsAreValid}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="h-5 w-5" />
                Crear proyecto
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

      <p className="mt-2 text-slate-500">{description}</p>

      <div className="mt-8">{children}</div>
    </section>
  );
}