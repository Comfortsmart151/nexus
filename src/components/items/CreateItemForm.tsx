import {
  type FormEvent,
  useState,
} from "react";
import { Plus } from "lucide-react";

interface CreateItemFormValues {
  name: string;
  unit: string;
  quantity: number;
}

interface CreateItemFormProps {
  onCreate: (
    values: CreateItemFormValues,
  ) => void;
}

const units = [
  "ud",
  "m",
  "m²",
  "m³",
  "kg",
  "lb",
  "ton",
  "gal",
  "litro",
  "día",
  "hora",
  "jornal",
  "global",
];

export default function CreateItemForm({
  onCreate,
}: CreateItemFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("ud");
  const [quantity, setQuantity] = useState("1");

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim() || !unit.trim()) {
      return;
    }

    const parsedQuantity = Number(quantity);

    onCreate({
      name: name.trim(),
      unit: unit.trim(),
      quantity:
        Number.isFinite(parsedQuantity) &&
        parsedQuantity >= 0
          ? parsedQuantity
          : 0,
    });

    setName("");
    setUnit("ud");
    setQuantity("1");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_140px_160px_auto]"
    >
      <div>
        <label className="text-sm font-medium text-slate-700">
          Descripción de la partida
        </label>

        <input
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Ej. Excavación manual en terreno natural"
          className="nexus-input mt-2"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Unidad
        </label>

        <select
          value={unit}
          onChange={(event) =>
            setUnit(event.target.value)
          }
          className="nexus-input mt-2"
        >
          {units.map((currentUnit) => (
            <option
              key={currentUnit}
              value={currentUnit}
            >
              {currentUnit}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Cantidad
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={quantity}
          onChange={(event) =>
            setQuantity(event.target.value)
          }
          className="nexus-input mt-2"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="mt-auto inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-5 w-5" />
        Agregar
      </button>
    </form>
  );
}