interface ItemHeaderProps {
  chapterOrder: number;
  chapterName: string;
}

export default function ItemHeader({
  chapterOrder,
  chapterName,
}: ItemHeaderProps) {
  return (
    <header className="mt-5">
      <p className="text-sm font-semibold text-blue-600">
        Capítulo {String(chapterOrder).padStart(2, "0")}
      </p>

      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
        {chapterName}
      </h1>

      <p className="mt-3 max-w-2xl text-slate-500">
        Agrega las partidas, unidades y cantidades que forman
        este capítulo.
      </p>
    </header>
  );
}