import type { NexusAiKnowledgeRule } from "@/types/nexus-ai";
import { MANUAL_COST_EXPANDED_RULES } from "@/data/nexus-ai/manualCostExpandedRules";

const DATE = "2026-09-09T00:00:00.000Z";

export const MANUAL_COST_KNOWLEDGE_RULES: NexusAiKnowledgeRule[] = [
  {
    id: "nexus-rule-manual-mortar-1-3", code: "NEXUS-MAN-MOR-001", name: "Mortero cemento-arena 1:3", category: "masonry",
    aliases: ["mortero 1:3", "mortero cemento arena 1:3", "mezcla 1:3", "mortero para juntas 1:3"],
    keywords: ["mortero", "1:3", "cemento", "arena", "juntas"], defaultUnit: "m³",
    description: "Plantilla técnica para producir 1 m³ de mortero 1:3. Coeficientes del Manual de Costos; precios actuales desde Biblioteca NEXUS.",
    resourceRules: [
      { id:"man-mor-cem", resourceType:"material", resourceCode:"MAT-03-000024", resourceName:"Cemento gris Portland Tipo I 42.5 kg", aliases:["cemento gris","cemento portland","cemento"], unit:"kg", coefficient:340, wastePercentage:0, required:true, preferredCategory:"Cementos", notes:"Manual: 8 fundas/m³; NEXUS normaliza 8 × 42.5 kg = 340 kg/m³." },
      { id:"man-mor-are", resourceType:"material", resourceCode:"MAT-03-000029", resourceName:"Arena lavada para hormigón", aliases:["arena","arena lavada","arena para mortero"], unit:"m³", coefficient:0.99, wastePercentage:0, required:true, preferredCategory:"Agregados", notes:"Manual: 0.99 m³ de arena por m³ de mortero 1:3." },
      { id:"man-mor-mo", resourceType:"labor", resourceCode:"MO-04-000019", resourceName:"Albañil de mampostería", aliases:["albañil","mezclador de mortero","oficial albañil"], unit:"hora", coefficient:4, wastePercentage:0, productivity:2, crewSize:1, required:true, preferredCategory:"Construcción", preferredSubcategory:"Albañilería", notes:"Manual: 1 hombre produce 2 m³/8 h = 4 h/m³." },
    ],
    assumptions:["Dosificación base 1 parte de cemento por 3 partes de arena.","El agua se controla como insumo operativo hasta disponer de recurso canónico compatible.","Los precios históricos del manual no se usan; NEXUS toma los precios vigentes de Biblioteca."],
    warnings:["Validar humedad y granulometría de la arena.","Ajustar agua y rendimiento a condiciones reales de obra."], isActive:true, createdAt:DATE, updatedAt:DATE,
  },
  {
    id:"nexus-rule-manual-excavation-earth-hand", code:"NEXUS-MAN-MT-001", name:"Excavación manual en tierra", category:"earthworks",
    aliases:["excavación manual en tierra","excavacion a mano en tierra","excavación de tierra a mano","excavacion manual"],
    keywords:["excavación","excavacion","manual","tierra","a mano"], defaultUnit:"m³",
    description:"Excavación manual por m³ con picado y paleo. Rendimientos estructurados desde el Manual de Costos.",
    resourceRules:[
      { id:"man-exc-pic", resourceType:"labor", resourceCode:"MO-31-000095", resourceName:"Obrero de movimiento de tierra", aliases:["picador","obrero","excavador manual"], unit:"hora", coefficient:2.424, wastePercentage:0, productivity:3.3, crewSize:1, required:true, preferredCategory:"Movimiento de tierra", notes:"Manual: tierra = 3.30 m³/día; jornada 8 h => 2.424 h/m³." },
      { id:"man-exc-pal", resourceType:"labor", resourceCode:"MO-01-000002", resourceName:"Ayudante general", aliases:["paleo","paleador","ayudante"], unit:"hora", coefficient:0.444, wastePercentage:0, productivity:18, crewSize:1, required:true, preferredCategory:"Mano de obra", notes:"Manual: paleo = 18 m³/día; jornada 8 h => 0.444 h/m³." },
    ],
    assumptions:["Material clasificado como tierra común y excavación accesible a mano.","No incluye bote, acarreo, entibado ni agotamiento.","Herramientas manuales se consideran menores."],
    warnings:["El rendimiento cambia con suelo, profundidad y humedad.","Tosca, grava, caliche y roca requieren otra variante."], isActive:true, createdAt:DATE, updatedAt:DATE,
  },
  ...([
    { inch: "4", blockCode: "MAT-04-001081", mortar: 0.020, chamber: 0.00198 },
    { inch: "6", blockCode: "MAT-04-001083", mortar: 0.028, chamber: 0.024 },
    { inch: "8", blockCode: "MAT-04-001085", mortar: 0.039, chamber: 0.0306 },
  ] as const).map(({ inch, blockCode, mortar, chamber }) => {
    const mortarCementKg = mortar * 340;
    const chamberCementKg = chamber * 7 * 42.5;
    const sandM3 = mortar * 0.99 + chamber * 0.52;
    const gravelM3 = chamber * 0.86;

    return {
      id: `nexus-rule-manual-block-${inch}-reinforced`,
      code: `NEXUS-MAN-MAM-${inch.padStart(3, "0")}R`,
      name: `Muro de block de ${inch} pulgadas reforzado`,
      category: "masonry" as const,
      aliases: [
        `muro de block de ${inch} reforzado`,
        `muro de block ${inch} estructural`,
        `mampostería reforzada de ${inch} pulgadas`,
        `mamposteria estructural ${inch} pulgadas`,
      ],
      keywords: ["muro", "block", inch, "reforzado", "refuerzo", "estructural", "mampostería"],
      defaultUnit: "m²",
      description: `Muro reforzado de block de ${inch} pulgadas por m²: block, acero, alambre, mortero 1:3 y llenado de cámara según criterios cuantitativos del Manual de Costos.`,
      resourceRules: [
        { id:`man-b${inch}-block`, resourceType:"material" as const, resourceCode:blockCode, resourceName:`Block de hormigón ${inch} in alta resistencia`, aliases:[`block ${inch}`,`block estructural ${inch}`,`bloque ${inch} pulgadas`], unit:"ud", coefficient:12.5, wastePercentage:3, required:true, preferredCategory:"Mampostería", notes:"Manual: 12.5 ud/m² + 3% desperdicio." },
        { id:`man-b${inch}-steel`, resourceType:"material" as const, resourceCode:"MAT-03-000052", resourceName:"Varilla corrugada de acero ASTM A615 Gr 60 #3 (3/8 in)", aliases:["varilla 3/8","acero de refuerzo","bastón"], unit:"kg", coefficient:1.016, wastePercentage:0, required:true, preferredCategory:"Acero", notes:"Manual: 0.0224 qq/m² para el patrón de bastones del ejemplo; confirmar diámetro y separación en planos." },
        { id:`man-b${inch}-wire`, resourceType:"material" as const, resourceCode:"MAT-03-000066", resourceName:"Alambre recocido negro calibre 18", aliases:["alambre #18","alambre de amarre","alambre recocido"], unit:"kg", coefficient:0.0218, wastePercentage:0, required:true, preferredCategory:"Acero", notes:"Manual: 0.048 lb/m², normalizado a kg." },
        { id:`man-b${inch}-cem`, resourceType:"material" as const, resourceCode:"MAT-03-000024", resourceName:"Cemento gris Portland Tipo I 42.5 kg", aliases:["cemento","cemento gris","cemento portland"], unit:"kg", coefficient:Number((mortarCementKg + chamberCementKg).toFixed(4)), wastePercentage:0, required:true, preferredCategory:"Cementos", notes:`Incluye cemento del mortero 1:3 (${mortar} m³/m²) y del hormigón de cámara 160 kg/cm² (${chamber} m³/m²).` },
        { id:`man-b${inch}-sand`, resourceType:"material" as const, resourceCode:"MAT-03-000029", resourceName:"Arena lavada para hormigón", aliases:["arena","arena lavada","arena mortero"], unit:"m³", coefficient:Number(sandM3.toFixed(5)), wastePercentage:0, required:true, preferredCategory:"Agregados", notes:"Arena combinada para mortero de juntas y hormigón de cámara según dosificaciones del Manual." },
        { id:`man-b${inch}-gravel`, resourceType:"material" as const, resourceCode:"MAT-03-000033", resourceName:"Grava triturada 3/4 in", aliases:["grava","grava limpia","agregado grueso"], unit:"m³", coefficient:Number(gravelM3.toFixed(5)), wastePercentage:0, required:true, preferredCategory:"Agregados", notes:"Agregado del hormigón de cámara 160 kg/cm²; confirmar granulometría de proyecto." },
        { id:`man-b${inch}-mo`, resourceType:"labor" as const, resourceCode:"MO-04-000019", resourceName:"Albañil de mampostería", aliases:["albañil","colocación de block"], unit:"hora", coefficient:0.8, wastePercentage:0, productivity:10, crewSize:1, required:true, preferredCategory:"Construcción", preferredSubcategory:"Albañilería", notes:"Coeficiente operativo editable; validar rendimiento según altura y acceso." },
        { id:`man-b${inch}-ay`, resourceType:"labor" as const, resourceCode:"MO-04-000020", resourceName:"Ayudante de albañil", aliases:["ayudante de albañil","ayudante"], unit:"hora", coefficient:0.8, wastePercentage:0, productivity:10, crewSize:1, required:true, preferredCategory:"Construcción", preferredSubcategory:"Albañilería" },
      ],
      assumptions: [
        "La palabra reforzado activa obligatoriamente acero, alambre y hormigón de cámara.",
        `Mortero de juntas 1:3 y volumen de cámara de referencia para block de ${inch} pulgadas.`,
        "Los precios históricos del Manual no se utilizan; los costos provienen de Biblioteca NEXUS.",
      ],
      warnings: [
        "Confirmar diámetro y separación real de bastones según planos estructurales.",
        "Confirmar resistencia/dosificación del hormigón de cámara según especificación de proyecto.",
        "No incluye pañete, pintura, dinteles, vigas ni columnas independientes.",
      ],
      isActive: true, createdAt: DATE, updatedAt: DATE,
    } as NexusAiKnowledgeRule;
  }),
  {
    id:"nexus-rule-manual-acrylic-paint", code:"NEXUS-MAN-PIN-001", name:"Pintura acrílica - plantilla Manual de Costos", category:"painting",
    aliases:["pintura acrílica según manual","pintura acrilica manual","pintura acrílica pared","aplicación pintura acrílica"],
    keywords:["pintura","acrílica","acrilica","pared","aplicación"], defaultUnit:"m²",
    description:"Plantilla por m² basada en rendimientos del Manual de Costos; precios actuales desde Biblioteca NEXUS.",
    resourceRules:[
      { id:"man-pin-pint", resourceType:"material", resourceCode:"MAT-09-000307", resourceName:"Pintura acrílica mate interior", aliases:["pintura acrílica","pintura interior","pintura pared"], unit:"gal", coefficient:0.1, wastePercentage:0, required:true, preferredCategory:"Pinturas", notes:"Manual: 2 galones / 20 m² = 0.10 gal/m²." },
      { id:"man-pin-lija", resourceType:"material", resourceCode:"MAT-09-000320", resourceName:"Lija para pared grano 120", aliases:["lija","piedra","lija pared"], unit:"lámina", coefficient:0.025, wastePercentage:0, required:false, preferredCategory:"Pinturas", notes:"Manual: 1 unidad / 40 m² = 0.025 ud/m²." },
      { id:"man-pin-rolo", resourceType:"material", resourceCode:"MAT-09-000317", resourceName:"Rodillo pintura 9 in", aliases:["rolo","rodillo"], unit:"ud", coefficient:0.0025, wastePercentage:0, required:false, preferredCategory:"Pinturas", notes:"Amortización editable; herramienta de aplicación reconocida por el Manual." },
      { id:"man-pin-brocha", resourceType:"material", resourceCode:"MAT-09-000318", resourceName:"Brocha pintura 2 in", aliases:["brocha","brocha pintura"], unit:"ud", coefficient:0.0025, wastePercentage:0, required:false, preferredCategory:"Pinturas" },
      { id:"man-pin-mo", resourceType:"labor", resourceCode:"MO-09-000044", resourceName:"Pintor", aliases:["pintor","aplicación pintura"], unit:"hora", coefficient:0.4, wastePercentage:0, productivity:20, crewSize:1, required:true, preferredCategory:"Terminaciones", preferredSubcategory:"Pintura", notes:"Base 8 h / 20 m² = 0.4 h/m²; ajustar por número de manos y superficie." },
    ],
    assumptions:["Superficie preparada sin reparaciones profundas.","Se usa el manual como fuente de rendimiento, no de precios."],
    warnings:["Rugosidad y absorción pueden aumentar consumo.","Agregar sellador/masilla cuando la especificación lo requiera."], isActive:true, createdAt:DATE, updatedAt:DATE,
  },
  ...MANUAL_COST_EXPANDED_RULES,
];
