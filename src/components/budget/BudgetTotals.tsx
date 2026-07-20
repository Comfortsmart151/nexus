"use client";

import {
  Calculator,
  CircleDollarSign,
  DollarSign,
  Percent,
  ReceiptText,
  Save,
} from "lucide-react";
import { useMemo } from "react";

export interface BudgetTotalsValues {
  generalExpensesPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  itbisPercentage: number;
  exchangeRate: number;
}

export interface BudgetTotalsResult {
  directCost: number;
  generalExpenses: number;
  contingency: number;
  profit: number;
  subtotalBeforeItbis: number;
  itbis: number;
  totalDop: number;
  totalUsd: number;
}

interface BudgetTotalsProps {
  directCost: number;
  values: BudgetTotalsValues;
  onChange: (
    values: BudgetTotalsValues,
    result: BudgetTotalsResult,
  ) => void;
  readOnly?: boolean;
}

export default function BudgetTotals({
  directCost,
  values,
  onChange,
  readOnly = false,
}: BudgetTotalsProps) {
  const result =
    useMemo<BudgetTotalsResult>(
      () =>
        calculateBudgetTotals(
          directCost,
          values,
        ),
      [directCost, values],
    );

  function updateValue(
    field: keyof BudgetTotalsValues,
    value: number,
  ) {
    const nextValues: BudgetTotalsValues = {
      ...values,
      [field]: sanitizeNumber(value),
    };

    const nextResult =
      calculateBudgetTotals(
        directCost,
        nextValues,
      );

    onChange(
      nextValues,
      nextResult,
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-blue-600" />

            <h2 className="text-lg font-bold text-slate-950">
              Resumen económico
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Los porcentajes y la tasa de cambio se guardan
            automáticamente para este presupuesto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            <Save className="h-4 w-4" />
            Guardado automático
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
            <Calculator className="h-5 w-5 text-blue-600" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Costo directo
              </p>

              <p className="font-black text-slate-950">
                {formatDop(
                  result.directCost,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
        <div className="border-b border-slate-200 p-5 sm:p-7 xl:border-b-0 xl:border-r">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Configuración
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <PercentageInput
              label="Gastos generales"
              value={
                values.generalExpensesPercentage
              }
              onChange={(value) =>
                updateValue(
                  "generalExpensesPercentage",
                  value,
                )
              }
              disabled={readOnly}
            />

            <PercentageInput
              label="Imprevistos"
              value={
                values.contingencyPercentage
              }
              onChange={(value) =>
                updateValue(
                  "contingencyPercentage",
                  value,
                )
              }
              disabled={readOnly}
            />

            <PercentageInput
              label="Utilidad"
              value={
                values.profitPercentage
              }
              onChange={(value) =>
                updateValue(
                  "profitPercentage",
                  value,
                )
              }
              disabled={readOnly}
            />

            <PercentageInput
              label="ITBIS"
              value={
                values.itbisPercentage
              }
              onChange={(value) =>
                updateValue(
                  "itbisPercentage",
                  value,
                )
              }
              disabled={readOnly}
            />
          </div>

          <div className="mt-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Tasa de cambio
              </span>

              <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">
                  RD$
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    values.exchangeRate
                  }
                  onChange={(event) =>
                    updateValue(
                      "exchangeRate",
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  disabled={readOnly}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 font-semibold text-slate-950 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />

                <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500">
                  por USD
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-slate-50 p-5 sm:p-7">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Totales
          </h3>

          <div className="mt-5 space-y-3">
            <TotalRow
              label="Costo directo"
              value={
                result.directCost
              }
            />

            <TotalRow
              label={`Gastos generales (${formatPercentage(
                values.generalExpensesPercentage,
              )})`}
              value={
                result.generalExpenses
              }
            />

            <TotalRow
              label={`Imprevistos (${formatPercentage(
                values.contingencyPercentage,
              )})`}
              value={
                result.contingency
              }
            />

            <TotalRow
              label={`Utilidad (${formatPercentage(
                values.profitPercentage,
              )})`}
              value={result.profit}
            />

            <div className="my-4 h-px bg-slate-200" />

            <TotalRow
              label="Subtotal antes de ITBIS"
              value={
                result.subtotalBeforeItbis
              }
              emphasized
            />

            <TotalRow
              label={`ITBIS (${formatPercentage(
                values.itbisPercentage,
              )})`}
              value={result.itbis}
            />
          </div>

          <div className="mt-6 rounded-2xl bg-blue-600 p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-100">
                  Total general RD$
                </p>

                <p className="mt-2 text-2xl font-black sm:text-3xl">
                  {formatDop(
                    result.totalDop,
                  )}
                </p>
              </div>

              <CircleDollarSign className="h-9 w-9 text-blue-200" />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total general USD
                </p>

                <p className="mt-2 text-2xl font-black text-slate-950">
                  {formatUsd(
                    result.totalUsd,
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Calculado con una tasa de{" "}
                  {formatDop(
                    values.exchangeRate,
                  )}{" "}
                  por USD
                </p>
              </div>

              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PercentageInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (
    value: number,
  ) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(
              Number(
                event.target.value,
              ),
            )
          }
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 font-semibold text-slate-950 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />

        <span className="flex items-center border-l border-slate-200 bg-slate-50 px-4 text-slate-500">
          <Percent className="h-4 w-4" />
        </span>
      </div>
    </label>
  );
}

function TotalRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span
        className={`text-sm ${
          emphasized
            ? "font-bold text-slate-900"
            : "text-slate-600"
        }`}
      >
        {label}
      </span>

      <span
        className={`whitespace-nowrap text-right ${
          emphasized
            ? "text-base font-black text-slate-950"
            : "text-sm font-bold text-slate-900"
        }`}
      >
        {formatDop(value)}
      </span>
    </div>
  );
}

export function calculateBudgetTotals(
  directCost: number,
  values: BudgetTotalsValues,
): BudgetTotalsResult {
  const safeDirectCost =
    sanitizeNumber(directCost);

  const generalExpenses =
    safeDirectCost *
    (sanitizeNumber(
      values.generalExpensesPercentage,
    ) /
      100);

  const contingency =
    safeDirectCost *
    (sanitizeNumber(
      values.contingencyPercentage,
    ) /
      100);

  const profit =
    safeDirectCost *
    (sanitizeNumber(
      values.profitPercentage,
    ) /
      100);

  const subtotalBeforeItbis =
    safeDirectCost +
    generalExpenses +
    contingency +
    profit;

  const itbis =
    subtotalBeforeItbis *
    (sanitizeNumber(
      values.itbisPercentage,
    ) /
      100);

  const totalDop =
    subtotalBeforeItbis +
    itbis;

  const exchangeRate =
    sanitizeNumber(
      values.exchangeRate,
    );

  const totalUsd =
    exchangeRate > 0
      ? totalDop /
        exchangeRate
      : 0;

  return {
    directCost:
      safeDirectCost,
    generalExpenses,
    contingency,
    profit,
    subtotalBeforeItbis,
    itbis,
    totalDop,
    totalUsd,
  };
}

function sanitizeNumber(
  value: number,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function formatPercentage(
  value: number,
): string {
  return `${sanitizeNumber(
    value,
  ).toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

function formatDop(
  value: number,
): string {
  return new Intl.NumberFormat(
    "es-DO",
    {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    sanitizeNumber(value),
  );
}

function formatUsd(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    sanitizeNumber(value),
  );
}