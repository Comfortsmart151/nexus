"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  SkipForward,
  Upload,
  X,
} from "lucide-react";

import {
  type ChangeEvent,
  type DragEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { LibraryImportService } from "@/services/libraryImport.service";

import type {
  LibraryImportDuplicateStrategy,
  LibraryImportPreview,
  LibraryImportPreviewRow,
  LibraryImportResult,
} from "@/types/library";

interface LibraryImportModalProps {
  onClose: () => void;
  onImported: (result: LibraryImportResult) => void;
}

type ModalStep = "upload" | "preview" | "result";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export default function LibraryImportModal({
  onClose,
  onImported,
}: LibraryImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<ModalStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null,
  );

  const [preview, setPreview] =
    useState<LibraryImportPreview | null>(null);

  const [result, setResult] =
    useState<LibraryImportResult | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const importableRows = useMemo(() => {
    if (!preview) {
      return 0;
    }

    return preview.rows.filter((row) => {
      if (row.status === "error" || !row.resource) {
        return false;
      }

      if (
        row.duplicate &&
        row.duplicateStrategy === "skip"
      ) {
        return false;
      }

      return true;
    }).length;
  }, [preview]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileInputChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await prepareFile(file);

    event.target.value = "";
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.currentTarget.contains(
        event.relatedTarget as Node | null,
      )
    ) {
      return;
    }

    setIsDragging(false);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await prepareFile(file);
  }

  async function prepareFile(file: File) {
    setErrorMessage("");

    if (!isAcceptedFile(file)) {
      setSelectedFile(null);
      setPreview(null);

      setErrorMessage(
        "Formato no compatible. Selecciona un archivo XLSX, XLS o CSV.",
      );

      return;
    }

    setSelectedFile(file);
    setPreview(null);
    setResult(null);
    setIsReading(true);

    try {
      const generatedPreview =
        await LibraryImportService.createPreview(file);

      setPreview(generatedPreview);
      setStep("preview");
    } catch (error) {
      setSelectedFile(null);
      setPreview(null);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible leer el archivo seleccionado.",
      );
    } finally {
      setIsReading(false);
    }
  }

  function changeDuplicateStrategy(
    rowNumber: number,
    strategy: LibraryImportDuplicateStrategy,
  ) {
    if (!preview) {
      return;
    }

    setPreview(
      LibraryImportService.updateDuplicateStrategy(
        preview,
        rowNumber,
        strategy,
      ),
    );
  }

  function changeAllDuplicateStrategies(
    strategy: LibraryImportDuplicateStrategy,
  ) {
    if (!preview) {
      return;
    }

    setPreview(
      LibraryImportService.updateAllDuplicateStrategies(
        preview,
        strategy,
      ),
    );
  }

  function executeImport() {
    if (!preview || isImporting) {
      return;
    }

    setErrorMessage("");
    setIsImporting(true);

    try {
      const importResult =
        LibraryImportService.executeImport({
          rows: preview.rows,
        });

      setResult(importResult);
      setStep("result");
      onImported(importResult);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible completar la importación.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  function resetImport() {
    setStep("upload");
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setErrorMessage("");
    setIsDragging(false);
    setIsReading(false);
    setIsImporting(false);
  }

  function handleClose() {
    if (isReading || isImporting) {
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-6 border-b border-slate-200 px-6 py-5 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FileSpreadsheet className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Importar recursos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Carga materiales, mano de obra, equipos y
                  subcontratos desde Excel o CSV.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isReading || isImporting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar importación"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === "upload" && (
            <UploadStep
              selectedFile={selectedFile}
              isDragging={isDragging}
              isReading={isReading}
              errorMessage={errorMessage}
              fileInputRef={fileInputRef}
              onOpenFilePicker={openFilePicker}
              onFileInputChange={handleFileInputChange}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          )}

          {step === "preview" && preview && (
            <PreviewStep
              preview={preview}
              selectedFile={selectedFile}
              importableRows={importableRows}
              errorMessage={errorMessage}
              onChangeDuplicateStrategy={
                changeDuplicateStrategy
              }
              onChangeAllDuplicateStrategies={
                changeAllDuplicateStrategies
              }
            />
          )}

          {step === "result" && result && (
            <ResultStep result={result} />
          )}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            {step === "preview" && (
              <button
                type="button"
                onClick={resetImport}
                disabled={isImporting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Seleccionar otro archivo
              </button>
            )}

            {step === "result" && (
              <button
                type="button"
                onClick={resetImport}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                Importar otro archivo
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              disabled={isReading || isImporting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === "result" ? "Cerrar" : "Cancelar"}
            </button>

            {step === "upload" && (
              <button
                type="button"
                onClick={openFilePicker}
                disabled={isReading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isReading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Leyendo archivo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Seleccionar archivo
                  </>
                )}
              </button>
            )}

            {step === "preview" && (
              <button
                type="button"
                onClick={executeImport}
                disabled={
                  isImporting || importableRows === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Importar {importableRows}{" "}
                    {importableRows === 1
                      ? "recurso"
                      : "recursos"}
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

interface UploadStepProps {
  selectedFile: File | null;
  isDragging: boolean;
  isReading: boolean;
  errorMessage: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenFilePicker: () => void;
  onFileInputChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}

function UploadStep({
  selectedFile,
  isDragging,
  isReading,
  errorMessage,
  fileInputRef,
  onOpenFilePicker,
  onFileInputChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: UploadStepProps) {
  return (
    <div className="p-6 lg:p-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onFileInputChange}
        className="hidden"
      />

      <div
        onClick={onOpenFilePicker}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        className={`flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
        }`}
      >
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-3xl ${
            isDragging
              ? "bg-blue-600 text-white"
              : "bg-white text-blue-600 shadow-sm"
          }`}
        >
          {isReading ? (
            <Loader2 className="h-9 w-9 animate-spin" />
          ) : (
            <Upload className="h-9 w-9" />
          )}
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-950">
          {isReading
            ? "Leyendo el archivo..."
            : "Arrastra tu archivo aquí"}
        </h3>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          También puedes hacer clic para seleccionarlo desde
          tu computadora. NEXUS admite archivos XLSX, XLS y
          CSV.
        </p>

        {selectedFile && (
          <div className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {selectedFile.name}
          </div>
        )}
      </div>

      {errorMessage && (
        <ErrorMessage message={errorMessage} />
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <InstructionCard
          number="1"
          title="Primera fila"
          description="Utiliza la primera fila del archivo para los nombres de las columnas."
        />

        <InstructionCard
          number="2"
          title="Campos obligatorios"
          description="Cada recurso necesita tipo, nombre, unidad y precio."
        />

        <InstructionCard
          number="3"
          title="Duplicados"
          description="Podrás omitirlos, actualizar el recurso existente o crear uno nuevo."
        />
      </div>
    </div>
  );
}

interface PreviewStepProps {
  preview: LibraryImportPreview;
  selectedFile: File | null;
  importableRows: number;
  errorMessage: string;
  onChangeDuplicateStrategy: (
    rowNumber: number,
    strategy: LibraryImportDuplicateStrategy,
  ) => void;
  onChangeAllDuplicateStrategies: (
    strategy: LibraryImportDuplicateStrategy,
  ) => void;
}

function PreviewStep({
  preview,
  selectedFile,
  importableRows,
  errorMessage,
  onChangeDuplicateStrategy,
  onChangeAllDuplicateStrategies,
}: PreviewStepProps) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <FileSpreadsheet className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-bold text-slate-950">
              {selectedFile?.name ?? preview.fileName}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {preview.totalRows}{" "}
              {preview.totalRows === 1
                ? "fila detectada"
                : "filas detectadas"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          {importableRows} listos para importar
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total"
          value={preview.totalRows}
          className="border-slate-200 bg-white text-slate-700"
        />

        <SummaryCard
          label="Válidos"
          value={preview.validRows}
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          label="Advertencias"
          value={preview.warningRows}
          className="border-amber-200 bg-amber-50 text-amber-700"
        />

        <SummaryCard
          label="Duplicados"
          value={preview.duplicateRows}
          className="border-blue-200 bg-blue-50 text-blue-700"
        />

        <SummaryCard
          label="Errores"
          value={preview.errorRows}
          className="border-red-200 bg-red-50 text-red-700"
        />
      </div>

      {preview.duplicateRows > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-semibold text-blue-950">
              Acción general para duplicados
            </p>

            <p className="mt-1 text-sm text-blue-700">
              Esta acción se aplicará a todos los recursos
              duplicados. También puedes cambiar cada fila.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <DuplicateActionButton
              icon={SkipForward}
              label="Omitir todos"
              onClick={() =>
                onChangeAllDuplicateStrategies("skip")
              }
            />

            <DuplicateActionButton
              icon={RefreshCw}
              label="Actualizar todos"
              onClick={() =>
                onChangeAllDuplicateStrategies("update")
              }
            />

            <DuplicateActionButton
              icon={Upload}
              label="Crear nuevos"
              onClick={() =>
                onChangeAllDuplicateStrategies("create")
              }
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <ErrorMessage message={errorMessage} />
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-4">Fila</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4">Código</th>
                <th className="px-4 py-4">Recurso</th>
                <th className="px-4 py-4">Tipo</th>
                <th className="px-4 py-4">Unidad</th>
                <th className="px-4 py-4 text-right">
                  Precio
                </th>
                <th className="px-4 py-4">Categoría</th>
                <th className="px-4 py-4">Observaciones</th>
                <th className="px-4 py-4">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {preview.rows.map((row) => (
                <PreviewTableRow
                  key={row.rowNumber}
                  row={row}
                  onChangeDuplicateStrategy={
                    onChangeDuplicateStrategy
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface PreviewTableRowProps {
  row: LibraryImportPreviewRow;
  onChangeDuplicateStrategy: (
    rowNumber: number,
    strategy: LibraryImportDuplicateStrategy,
  ) => void;
}

function PreviewTableRow({
  row,
  onChangeDuplicateStrategy,
}: PreviewTableRowProps) {
  const messages = [
    ...row.errors.map((issue) => issue.message),
    ...row.warnings.map((issue) => issue.message),
  ];

  if (row.duplicate) {
    messages.unshift(
      `Coincide con ${row.duplicate.code} — ${row.duplicate.name}.`,
    );
  }

  return (
    <tr className="align-top transition hover:bg-slate-50">
      <td className="px-4 py-4 text-sm font-semibold text-slate-500">
        {row.rowNumber}
      </td>

      <td className="px-4 py-4">
        <StatusBadge status={row.status} />
      </td>

      <td className="px-4 py-4 text-sm font-semibold text-blue-700">
        {row.resource?.code || "Automático"}
      </td>

      <td className="px-4 py-4">
        <p className="font-semibold text-slate-900">
          {row.resource?.name || "Sin nombre"}
        </p>

        {row.resource?.supplier && (
          <p className="mt-1 text-xs text-slate-500">
            {row.resource.supplier}
          </p>
        )}
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {row.resource
          ? getResourceTypeLabel(row.resource.type)
          : "—"}
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {row.resource?.unit || "—"}
      </td>

      <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
        {row.resource
          ? formatCurrency(row.resource.defaultUnitPrice)
          : "—"}
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {row.resource?.category || "Sin categoría"}
      </td>

      <td className="max-w-sm px-4 py-4">
        {messages.length > 0 ? (
          <ul className="space-y-1 text-xs leading-5 text-slate-500">
            {messages.map((message, index) => (
              <li key={`${row.rowNumber}-${index}`}>
                {message}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-slate-400">
            Sin observaciones
          </span>
        )}
      </td>

      <td className="px-4 py-4">
        {row.duplicate ? (
          <select
            value={row.duplicateStrategy}
            onChange={(event) =>
              onChangeDuplicateStrategy(
                row.rowNumber,
                event.target
                  .value as LibraryImportDuplicateStrategy,
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="skip">Omitir</option>
            <option value="update">
              Actualizar existente
            </option>
            <option value="create">
              Crear como nuevo
            </option>
          </select>
        ) : row.status === "error" ? (
          <span className="text-sm font-semibold text-red-600">
            No se importará
          </span>
        ) : (
          <span className="text-sm font-semibold text-emerald-600">
            Crear recurso
          </span>
        )}
      </td>
    </tr>
  );
}

interface ResultStepProps {
  result: LibraryImportResult;
}

function ResultStep({ result }: ResultStepProps) {
  const completedWithoutErrors = result.failed === 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
            completedWithoutErrors
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {completedWithoutErrors ? (
            <CheckCircle2 className="h-10 w-10" />
          ) : (
            <AlertCircle className="h-10 w-10" />
          )}
        </div>

        <h3 className="mt-6 text-2xl font-bold text-slate-950">
          {completedWithoutErrors
            ? "Importación completada"
            : "Importación completada con observaciones"}
        </h3>

        <p className="mt-2 text-slate-500">
          NEXUS procesó el archivo y actualizó la biblioteca
          de recursos.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ResultCard
          label="Procesados"
          value={result.totalProcessed}
        />

        <ResultCard
          label="Creados"
          value={result.created}
        />

        <ResultCard
          label="Actualizados"
          value={result.updated}
        />

        <ResultCard
          label="Omitidos"
          value={result.skipped}
        />

        <ResultCard
          label="Fallidos"
          value={result.failed}
        />
      </div>

      {result.errors.length > 0 && (
        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-red-200">
          <div className="border-b border-red-200 bg-red-50 px-5 py-4">
            <h4 className="font-semibold text-red-900">
              Filas que no pudieron importarse
            </h4>
          </div>

          <div className="max-h-72 divide-y divide-red-100 overflow-y-auto bg-white">
            {result.errors.map((error) => (
              <div
                key={`${error.rowNumber}-${error.message}`}
                className="flex gap-4 px-5 py-4"
              >
                <span className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                  Fila {error.rowNumber}
                </span>

                <p className="text-sm leading-6 text-slate-600">
                  {error.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface InstructionCardProps {
  number: string;
  title: string;
  description: string;
}

function InstructionCard({
  number,
  title,
  description,
}: InstructionCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
        {number}
      </div>

      <h4 className="mt-4 font-semibold text-slate-900">
        {title}
      </h4>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  className: string;
}

function SummaryCard({
  label,
  value,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-wider">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

interface ResultCardProps {
  label: string;
  value: number;
}

function ResultCard({ label, value }: ResultCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <p className="text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

interface DuplicateActionButtonProps {
  icon: typeof SkipForward;
  label: string;
  onClick: () => void;
}

function DuplicateActionButton({
  icon: Icon,
  label,
  onClick,
}: DuplicateActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: LibraryImportPreviewRow["status"];
}) {
  const styles = {
    valid:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
    duplicate:
      "border-blue-200 bg-blue-50 text-blue-700",
  };

  const labels = {
    valid: "Válido",
    warning: "Advertencia",
    error: "Error",
    duplicate: "Duplicado",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

      <p className="text-sm font-medium leading-6">
        {message}
      </p>
    </div>
  );
}

function isAcceptedFile(file: File): boolean {
  const normalizedName = file.name.trim().toLowerCase();

  return ACCEPTED_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
}

function getResourceTypeLabel(
  type: "material" | "labor" | "equipment" | "subcontract",
): string {
  const labels = {
    material: "Material",
    labor: "Mano de obra",
    equipment: "Equipo",
    subcontract: "Subcontrato",
  };

  return labels[type];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}