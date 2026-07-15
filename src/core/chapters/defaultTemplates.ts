export interface ChapterTemplate {
  name: string;
}

export const DEFAULT_CHAPTERS: Record<string, ChapterTemplate[]> = {
  Vivienda: [
    { name: "Preliminares" },
    { name: "Movimiento de tierra" },
    { name: "Cimentación" },
    { name: "Hormigón armado" },
    { name: "Mampostería" },
    { name: "Cubierta" },
    { name: "Instalaciones sanitarias" },
    { name: "Instalaciones eléctricas" },
    { name: "Terminaciones" },
    { name: "Pintura" },
    { name: "Obras exteriores" },
  ],

  "Edificio residencial": [
    { name: "Preliminares" },
    { name: "Movimiento de tierra" },
    { name: "Cimentación" },
    { name: "Estructura" },
    { name: "Mampostería" },
    { name: "Cubierta" },
    { name: "Instalaciones sanitarias" },
    { name: "Instalaciones eléctricas" },
    { name: "Climatización" },
    { name: "Terminaciones" },
    { name: "Pintura" },
    { name: "Obras exteriores" },
  ],

  "Edificio comercial": [
    { name: "Preliminares" },
    { name: "Movimiento de tierra" },
    { name: "Cimentación" },
    { name: "Estructura" },
    { name: "Mampostería" },
    { name: "Cubierta" },
    { name: "Instalaciones sanitarias" },
    { name: "Instalaciones eléctricas" },
    { name: "Climatización" },
    { name: "Sistema contra incendios" },
    { name: "Terminaciones" },
    { name: "Pintura" },
    { name: "Obras exteriores" },
  ],

  Remodelación: [
    { name: "Preliminares" },
    { name: "Demoliciones" },
    { name: "Adecuaciones" },
    { name: "Mampostería" },
    { name: "Instalaciones sanitarias" },
    { name: "Instalaciones eléctricas" },
    { name: "Terminaciones" },
    { name: "Pintura" },
  ],

  "Obra vial": [
    { name: "Preliminares" },
    { name: "Movimiento de tierra" },
    { name: "Drenaje" },
    { name: "Subbase" },
    { name: "Base" },
    { name: "Pavimento" },
    { name: "Señalización" },
    { name: "Obras complementarias" },
  ],

  "Obra hidráulica": [
    { name: "Preliminares" },
    { name: "Movimiento de tierra" },
    { name: "Tuberías" },
    { name: "Accesorios" },
    { name: "Válvulas" },
    { name: "Cámaras y registros" },
    { name: "Pruebas hidráulicas" },
    { name: "Reposición de superficies" },
  ],

  Otra: [],
};

export function getTemplate(projectType: string): ChapterTemplate[] {
  return DEFAULT_CHAPTERS[projectType] ?? [];
}