import type { NexusAiKnowledgeRule, NexusAiResourceRule, NexusAiConstructionCategory } from "@/types/nexus-ai";

const DATE = "2026-09-09T00:00:00.000Z";
const rr = (x: NexusAiResourceRule): NexusAiResourceRule => x;
const rule = (x: Omit<NexusAiKnowledgeRule,"createdAt"|"updatedAt"|"isActive">): NexusAiKnowledgeRule => ({...x,isActive:true,createdAt:DATE,updatedAt:DATE});
const common = (category: NexusAiConstructionCategory, unit: string, description: string) => ({category,defaultUnit:unit,description});

/**
 * Plantillas cuantitativas extraídas del Manual de Costos aportado por el usuario.
 * IMPORTANTE: sólo se importan composición/rendimientos. Los precios del manual son históricos
 * y se resuelven siempre contra la Biblioteca Maestra NEXUS.
 */
export const MANUAL_COST_EXPANDED_RULES: NexusAiKnowledgeRule[] = [
  ...[
    ["earth","tierra",3.30],["tosca","tosca",1.10],["gravel","grava",1.50],["caliche","caliche",1.30],["soft-rock","roca blanda",0.30]
  ].map(([slug,label,prod]) => rule({
    id:`nexus-rule-manual-exc-${slug}`,code:`NEXUS-MAN-EXC-${String(slug).toUpperCase()}`,name:`Excavación manual en ${label}`,
    ...common("earthworks","m³",`Excavación manual de ${label}; rendimiento del Manual de Costos normalizado a horas por m³.`),
    aliases:[`excavación manual ${label}`,`excavacion a mano ${label}`,`excavar ${label}`],keywords:["excavación","manual",String(label)],
    resourceRules:[
      rr({id:`exc-${slug}-pic`,resourceType:"labor",resourceName:"Obrero de movimiento de tierra",aliases:["picador","excavador manual","obrero"],unit:"hora",coefficient:8/Number(prod),wastePercentage:0,productivity:Number(prod),crewSize:1,required:true,preferredCategory:"Movimiento de tierra",notes:`Manual: ${prod} m³/día; jornada base 8 h.`}),
      rr({id:`exc-${slug}-pal`,resourceType:"labor",resourceName:"Ayudante general",aliases:["paleo","paleador","ayudante"],unit:"hora",coefficient:8/18,wastePercentage:0,productivity:18,crewSize:1,required:true,notes:"Manual: paleo 18 m³/día."}),
      rr({id:`exc-${slug}-pala`,resourceType:"equipment",resourceName:"Pala manual",aliases:["pala","pala de excavación"],unit:"m³",coefficient:1,wastePercentage:0,required:false,notes:"Herramienta menor; precio/uso desde Biblioteca."}),
      rr({id:`exc-${slug}-pico`,resourceType:"equipment",resourceName:"Pico manual",aliases:["pico","pico de excavación"],unit:"m³",coefficient:1,wastePercentage:0,required:false,notes:"Herramienta menor; precio/uso desde Biblioteca."}),
    ],assumptions:["Excavación accesible a mano.","No incluye bote, entibado ni agotamiento."],warnings:["Ajustar por profundidad, humedad, acceso y condiciones reales del terreno."]
  })),

  rule({id:"nexus-rule-manual-fill-replacement",code:"NEXUS-MAN-REL-001",name:"Relleno de reposición manual",...common("earthworks","m³","Relleno de reposición con paleo, apisonado y regado."),aliases:["relleno de reposición","relleno manual","relleno y apisonado"],keywords:["relleno","reposición","apisonado","regado"],resourceRules:[
    rr({id:"rel-paleo",resourceType:"labor",resourceName:"Ayudante general",aliases:["paleo","paleador"],unit:"hora",coefficient:8/18,wastePercentage:0,productivity:18,required:true}),
    rr({id:"rel-compact",resourceType:"labor",resourceName:"Ayudante general",aliases:["apisonado","regado","compactación manual"],unit:"hora",coefficient:8/10,wastePercentage:0,productivity:10,required:true}),
    rr({id:"rel-pala",resourceType:"equipment",resourceName:"Pala manual",aliases:["pala"],unit:"m³",coefficient:1,wastePercentage:0,required:false}),
    rr({id:"rel-pison",resourceType:"equipment",resourceName:"Pisón manual",aliases:["pisón","pison"],unit:"m³",coefficient:1,wastePercentage:0,required:false})
  ],assumptions:["Material de relleno disponible en sitio; no incluye suministro."],warnings:["Validar humedad óptima y grado de compactación requerido."]}),

  rule({id:"nexus-rule-manual-fill-caliche",code:"NEXUS-MAN-REL-002",name:"Relleno compactado manual con caliche",...common("earthworks","m³","Relleno compactado a mano para piso, incluyendo esponjamiento/suministro de caliche."),aliases:["relleno compactado con caliche","relleno de caliche","relleno para piso"],keywords:["relleno","compactado","caliche","piso"],resourceRules:[
    rr({id:"rel2-cal",resourceType:"material",resourceName:"Caliche para relleno",aliases:["caliche","material de relleno caliche"],unit:"m³",coefficient:1.30,wastePercentage:0,required:true,preferredCategory:"Agregados",notes:"Manual: 1.30 m³ suelto por 1 m³ compactado."}),
    rr({id:"rel2-trans",resourceType:"labor",resourceName:"Ayudante general",aliases:["traslado manual","carretillero"],unit:"hora",coefficient:1.8,wastePercentage:0,required:true,notes:"Manual: 18 carretillas/m³ y 10 carretillas/h = 1.8 h/m³."}),
    rr({id:"rel2-paleo",resourceType:"labor",resourceName:"Ayudante general",aliases:["paleo","paleador"],unit:"hora",coefficient:8/18,wastePercentage:0,required:true}),
    rr({id:"rel2-comp",resourceType:"labor",resourceName:"Ayudante general",aliases:["apisonado","compactación manual"],unit:"hora",coefficient:8/10,wastePercentage:0,required:true}),
    rr({id:"rel2-car",resourceType:"equipment",resourceName:"Carretilla de construcción",aliases:["carretilla","carretilla tipo jeep"],unit:"m³",coefficient:1,wastePercentage:0,required:false})
  ],assumptions:["Compactación manual para piso."],warnings:["Validar densidad, humedad y factor de compactación por especificación geotécnica."]}),

  rule({id:"nexus-rule-manual-haul-manual",code:"NEXUS-MAN-BOT-001",name:"Bote de material con llenado manual",...common("transport","m³","Bote de material con traslado/llenado manual y acarreo; estructura derivada del Manual."),aliases:["bote manual","bote de escombros manual","acarreo de material con llenado a mano"],keywords:["bote","material","acarreo","llenado manual"],resourceRules:[
    rr({id:"bot-trans",resourceType:"labor",resourceName:"Ayudante general",aliases:["traslado","carretillero"],unit:"hora",coefficient:1.8,wastePercentage:0,required:true,notes:"Manual: 18 carretillas/m³, 5 min/ciclo, hora efectiva 50 min."}),
    rr({id:"bot-fill",resourceType:"labor",resourceName:"Ayudante general",aliases:["llenado","carga manual"],unit:"hora",coefficient:4/6,wastePercentage:0,required:true,notes:"Manual: cuadrilla de 4 hombres carga 24 m³ en 4 h; equivalente 0.667 h-h/m³."}),
    rr({id:"bot-truck",resourceType:"equipment",resourceName:"Camión volteo",aliases:["camión volteo","camion de volteo","volteo"],unit:"m³",coefficient:1,wastePercentage:0,required:true,preferredCategory:"Transporte"})
  ],assumptions:["Distancia de acarreo se define en el proyecto."],warnings:["Aplicar esponjamiento según material; el manual indica rangos crecientes desde granular hasta roca dura."]}),

  ...[
    ["160",7,0.52,0.86,60],["180",8,0.45,0.88,60],["210",10,0.45,0.88,60]
  ].map(([strength,bags,sand,gravel,water])=>rule({id:`nexus-rule-manual-concrete-${strength}`,code:`NEXUS-MAN-HOR-${strength}`,name:`Hormigón ${strength} kg/cm² preparado en obra`,...common("concrete","m³",`Dosificación de hormigón ${strength} kg/cm² tomada del Manual; precios desde Biblioteca NEXUS.`),aliases:[`hormigón ${strength}`,`hormigon ${strength}`,`concreto ${strength}`],keywords:["hormigón",String(strength),"cemento","arena","grava"],resourceRules:[
    rr({id:`h${strength}-cem`,resourceType:"material",resourceCode:"MAT-03-000024",resourceName:"Cemento gris Portland Tipo I 42.5 kg",aliases:["cemento","cemento portland"],unit:"kg",coefficient:Number(bags)*42.5,wastePercentage:0,required:true,preferredCategory:"Cementos",notes:`Manual: ${bags} fundas por m³; normalizado a kg.`}),
    rr({id:`h${strength}-sand`,resourceType:"material",resourceCode:"MAT-03-000029",resourceName:"Arena lavada para hormigón",aliases:["arena lavada","arena"],unit:"m³",coefficient:Number(sand),wastePercentage:0,required:true,preferredCategory:"Agregados"}),
    rr({id:`h${strength}-grav`,resourceType:"material",resourceCode:"MAT-03-000033",resourceName:"Grava triturada 3/4 in",aliases:["grava limpia","grava","grava para hormigón"],unit:"m³",coefficient:Number(gravel),wastePercentage:0,required:true,preferredCategory:"Agregados"}),
    rr({id:`h${strength}-water`,resourceType:"material",resourceCode:"MAT-03-003488",resourceName:"Agua para construcción",aliases:["agua","agua de mezcla"],unit:"gal",coefficient:Number(water),wastePercentage:0,required:true})
  ],assumptions:["Dosificación de referencia del Manual; verificar diseño de mezcla y especificación estructural."],warnings:["No sustituye diseño de mezcla certificado.","Ajustar por humedad de agregados y resistencia especificada."]})),

  rule({id:"nexus-rule-manual-concrete-mix-place",code:"NEXUS-MAN-HOR-LV",name:"Ligado y vaciado de hormigón con ligadora",...common("concrete","m³","Cuadrilla y equipo para ligado/vaciado a nivel de piso con ligadora de una funda."),aliases:["ligado y vaciado de hormigón","vaciado con ligadora","mezclado de hormigón en obra"],keywords:["ligado","vaciado","hormigón","ligadora"],resourceRules:[
    rr({id:"lv-mixer",resourceType:"equipment",resourceCode:"EQ-03-000012",resourceName:"Mezcladora de hormigón tipo trompo 1 saco",aliases:["ligadora","mezcladora de concreto","hormigonera"],unit:"hora",coefficient:0.25,wastePercentage:0,productivity:4,required:true,notes:"Manual: rendimiento 4 m³/h."}),
    rr({id:"lv-op",resourceType:"labor",resourceCode:"MO-03-000015",resourceName:"Hormigonero",aliases:["hormigonero","operador ligadora","operador de mezcladora"],unit:"hora",coefficient:0.25,wastePercentage:0,required:true}),
    rr({id:"lv-peon",resourceType:"labor",resourceName:"Ayudante general",aliases:["peón","peon","ayudante"],unit:"hora",coefficient:2.5,wastePercentage:0,required:true,notes:"Manual describe personal de arena/grava, traslado, cemento y agua; coeficiente normalizado por 4 m³/h y sujeto a revisión de cuadrilla."}),
    rr({id:"lv-alb",resourceType:"labor",resourceName:"Albañil",aliases:["albañil","tendedor"],unit:"hora",coefficient:0.25,wastePercentage:0,required:true})
  ],assumptions:["Vaciado a nivel de piso y acceso normal."],warnings:["Revisar cuadrilla según distancia de traslado, método de colocación y volumen de vaciado."]}),

  rule({id:"nexus-rule-manual-scaffold-wood",code:"NEXUS-MAN-AND-001",name:"Andamio de madera",...common("preliminaries","m²","Andamio de madera amortizado por número de usos."),aliases:["andamio de madera","andamiaje de madera"],keywords:["andamio","madera"],resourceRules:[
    rr({id:"and-wood",resourceType:"material",resourceName:"Madera para encofrado y andamio",aliases:["madera","pino","madera de andamio"],unit:"pie²",coefficient:23.79,wastePercentage:0,required:true,notes:"Manual: 190.33 pie² / 8 usos = 23.79 pie²."}),
    rr({id:"and-nail",resourceType:"material",resourceName:"Clavo dulce",aliases:["clavo dulce","clavos"],unit:"lb",coefficient:8.52,wastePercentage:0,required:true}),
    rr({id:"and-steelnail",resourceType:"material",resourceName:"Clavo de acero",aliases:["clavo acero"],unit:"lb",coefficient:1,wastePercentage:0,required:false}),
    rr({id:"and-labor",resourceType:"labor",resourceName:"Carpintero",aliases:["colocación y retiro de andamio","carpintero"],unit:"hora",coefficient:8/24,wastePercentage:0,productivity:24,required:true,notes:"Manual: colocación/retiro 24 m² por jornada de referencia."})
  ],assumptions:["Factor de uso del ejemplo: 8 reutilizaciones."],warnings:["Ajustar número de usos y sistema de andamio a seguridad, altura y proyecto."]}),

  ...[
    ["wall","Pañete de pared",0.0167,30],["ceiling","Pañete de techo",0.0167,30]
  ].map(([slug,label,thickness,waste])=>rule({id:`nexus-rule-manual-plaster-${slug}`,code:`NEXUS-MAN-PAN-${String(slug).toUpperCase()}`,name:String(label),...common("plaster","m²",`${label} con mortero bastardo; espesor y desperdicio del Manual.`),aliases:[String(label).toLowerCase(),`pañete ${slug==="wall"?"pared":"techo"}`,`panete ${slug==="wall"?"pared":"techo"}`],keywords:["pañete",slug==="wall"?"pared":"techo","mortero"],resourceRules:[
    rr({id:`pan-${slug}-mortar`,resourceType:"material",resourceName:"Mortero bastardo 1:1:4",aliases:["mortero 1:1:4","mortero para pañete","mortero bastardo"],unit:"m³",coefficient:Number(thickness),wastePercentage:Number(waste),required:true,notes:"Manual: e=0.0167 m y 30% desperdicio."}),
    rr({id:`pan-${slug}-labor`,resourceType:"labor",resourceName:"Albañil de terminaciones",aliases:["pañetador","albañil","aplicación de pañete"],unit:"hora",coefficient:8/60,wastePercentage:0,productivity:60,required:true,notes:"Manual: análisis sobre 60 m²; ligado y aplicación incluidos."})
  ],assumptions:["Superficie apta para recibir pañete."],warnings:["No incluye andamio salvo que se active como recurso adicional."]})),

  rule({id:"nexus-rule-manual-fino-roof",code:"NEXUS-MAN-FIN-001",name:"Fino de techo",...common("finishes","m²","Fino de techo con mortero; espesor base 4 cm del ejemplo del Manual."),aliases:["fino de techo","fino en techo","mortero de fino"],keywords:["fino","techo","mortero"],resourceRules:[
    rr({id:"fin-mortar",resourceType:"material",resourceName:"Mortero cemento-arena 1:3",aliases:["mortero 1:3","mortero para fino"],unit:"m³",coefficient:0.04,wastePercentage:5,required:true,notes:"Manual: 25 m² × 0.04 m = 1 m³ + 5% desperdicio."}),
    rr({id:"fin-labor",resourceType:"labor",resourceName:"Albañil de terminaciones",aliases:["aplicación de fino","albañil"],unit:"hora",coefficient:8/25,wastePercentage:0,productivity:25,required:true}),
    rr({id:"fin-hoist",resourceType:"labor",resourceName:"Ayudante general",aliases:["subida de materiales","peón"],unit:"hora",coefficient:2.27*0.04,wastePercentage:0,required:false,notes:"Manual: 2.27 h/peón/m³ de subida; normalizado al consumo por m²."})
  ],assumptions:["Espesor base 4 cm; editable."],warnings:["El Manual indica 2–4 cm para techos inclinados; confirmar pendiente y espesor."]}),

  rule({id:"nexus-rule-manual-zabaleta",code:"NEXUS-MAN-ZAB-001",name:"Zabaleta de mortero",...common("finishes","m","Zabaleta por metro lineal."),aliases:["zabaleta","confección de zabaleta"],keywords:["zabaleta","mortero"],resourceRules:[
    rr({id:"zab-mortar",resourceType:"material",resourceName:"Mortero cemento-arena 1:3",aliases:["mortero 1:3"],unit:"m³",coefficient:0.0075,wastePercentage:5,required:true}),
    rr({id:"zab-labor",resourceType:"labor",resourceName:"Albañil de terminaciones",aliases:["confección zabaleta","albañil"],unit:"hora",coefficient:0.25,wastePercentage:0,required:true,notes:"Coeficiente operativo editable; el Manual expresa colocación por metro."})
  ],assumptions:["Geometría base del ejemplo del Manual."],warnings:["Confirmar dimensiones de la zabaleta."]}),

  rule({id:"nexus-rule-manual-edge",code:"NEXUS-MAN-CAN-001",name:"Canto terminado con mortero",...common("finishes","m","Canto de mortero por metro lineal."),aliases:["canto de mortero","confección de canto","canto terminado"],keywords:["canto","mortero","terminación"],resourceRules:[
    rr({id:"can-mortar",resourceType:"material",resourceName:"Mortero bastardo 1:1:4",aliases:["mortero 1:1:4","mortero"],unit:"m³",coefficient:0.0034,wastePercentage:10,required:true}),
    rr({id:"can-wood",resourceType:"material",resourceName:"Madera para regla",aliases:["madera","regla"],unit:"pie²",coefficient:0.109,wastePercentage:0,required:false,notes:"Manual: madera amortizada en 10 usos."}),
    rr({id:"can-labor",resourceType:"labor",resourceName:"Albañil de terminaciones",aliases:["confección de canto","canteado"],unit:"hora",coefficient:0.30,wastePercentage:0,required:true})
  ],assumptions:["Sección base del ejemplo del Manual."],warnings:["Confirmar ancho y espesor del canto."]}),

  ...[
    ["mosaic","Piso de mosaico/granito","Mosaico de granito para piso",0.0315,0.074,1.05],["ceramic","Piso de cerámica","Cerámica para piso",0.031,0.074,1.05]
  ].map(([slug,label,supply,mortar,base,supplyQty])=>rule({id:`nexus-rule-manual-floor-${slug}`,code:`NEXUS-MAN-PIS-${String(slug).toUpperCase()}`,name:String(label),...common("flooring","m²",`${label} según composición del Manual.`),aliases:[String(label).toLowerCase(),`colocación ${slug==="mosaic"?"mosaico":"cerámica"}`],keywords:["piso",slug==="mosaic"?"mosaico":"cerámica","colocación"],resourceRules:[
    rr({id:`pis-${slug}-supply`,resourceType:"material",resourceName:String(supply),aliases:[slug==="mosaic"?"mosaico":"cerámica","suministro piso"],unit:"m²",coefficient:Number(supplyQty),wastePercentage:0,required:true,notes:"Manual: suministro 1.05 m² por m², equivalente a 5% adicional."}),
    rr({id:`pis-${slug}-mortar`,resourceType:"material",resourceName:"Mortero cemento-arena 1:3",aliases:["mortero 1:3","mortero colocación piso"],unit:"m³",coefficient:Number(mortar),wastePercentage:0,required:true}),
    rr({id:`pis-${slug}-base`,resourceType:"material",resourceName:"Hormigón 160 kg/cm²",aliases:["hormigón 1:3:5","hormigón base"],unit:"m³",coefficient:Number(base),wastePercentage:0,required:true}),
    rr({id:`pis-${slug}-grout`,resourceType:"material",resourceName:"Cemento blanco para derretido",aliases:["derretido","cemento blanco","boquilla"],unit:"lb",coefficient:2.75,wastePercentage:10,required:false}),
    rr({id:`pis-${slug}-labor`,resourceType:"labor",resourceName:"Instalador de pisos",aliases:["colocador de cerámica","colocación piso","albañil"],unit:"hora",coefficient:0.5,wastePercentage:0,required:true})
  ],assumptions:["Base y espesor según detalle del Manual."],warnings:["Confirmar formato de pieza, adhesivo especificado y condición de la base."]})),

  rule({id:"nexus-rule-manual-wall-ceramic",code:"NEXUS-MAN-REV-001",name:"Revestimiento cerámico en pared de baño",...common("finishes","m²","Colocación de cerámica en pared de baño según el Manual."),aliases:["cerámica pared baño","revestimiento cerámico baño","colocación cerámica pared"],keywords:["cerámica","pared","baño","revestimiento"],resourceRules:[
    rr({id:"rev-cer",resourceType:"material",resourceName:"Cerámica para pared",aliases:["cerámica pared","cerámica baño"],unit:"m²",coefficient:1.05,wastePercentage:0,required:true}),
    rr({id:"rev-mor",resourceType:"material",resourceName:"Mortero cemento-arena 1:3",aliases:["mortero 1:3"],unit:"m³",coefficient:0.021,wastePercentage:0,required:true}),
    rr({id:"rev-grout",resourceType:"material",resourceName:"Cemento blanco para derretido",aliases:["derretido","cemento blanco","boquilla"],unit:"lb",coefficient:3.75,wastePercentage:10,required:false}),
    rr({id:"rev-labor",resourceType:"labor",resourceName:"Instalador de cerámica",aliases:["colocador cerámica","albañil"],unit:"hora",coefficient:0.5,wastePercentage:0,required:true})
  ],assumptions:["Espesor de mortero 2 cm y 5% adicional ya incorporado en 0.021 m³."],warnings:["Confirmar adhesivo moderno si la especificación no usa mortero tradicional."]}),

  rule({id:"nexus-rule-manual-rubbed-floor",code:"NEXUS-MAN-PIS-FRO",name:"Piso frotado / piso rejón",...common("flooring","m²","Piso frotado con base de hormigón y terminación de mortero."),aliases:["piso frotado","piso rejón","piso rejon"],keywords:["piso","frotado","rejón"],resourceRules:[
    rr({id:"fro-mor",resourceType:"material",resourceName:"Mortero cemento-arena 1:3",aliases:["mortero terminación","mortero 1:3"],unit:"m³",coefficient:0.022,wastePercentage:0,required:true}),
    rr({id:"fro-hor",resourceType:"material",resourceName:"Hormigón 160 kg/cm²",aliases:["hormigón 1:3:5","hormigón base"],unit:"m³",coefficient:0.084,wastePercentage:0,required:true}),
    rr({id:"fro-labor",resourceType:"labor",resourceName:"Albañil de pisos",aliases:["confección piso frotado","albañil"],unit:"hora",coefficient:0.5,wastePercentage:0,required:true})
  ],assumptions:["Base 8 cm y terminación 2 cm según ejemplo."],warnings:["Confirmar espesores de proyecto."]}),


  ...[
    ["4",0.020,"MAT-04-001080"],["6",0.028,"MAT-04-001082"],["8",0.039,"MAT-04-001084"]
  ].map(([inch,mortar,blockCode])=>rule({id:`nexus-rule-manual-block-${inch}-standard`,code:`NEXUS-MAN-MAM-${inch}`,name:`Muro de block de ${inch} pulgadas`,...common("masonry","m²",`Muro de block de ${inch} pulgadas; consumo de block y mortero según Manual de Costos.`),aliases:[`muro de block ${inch}`,`pared de block ${inch}`,`mampostería ${inch} pulgadas`],keywords:["muro","block",String(inch),"mampostería"],resourceRules:[
    rr({id:`b${inch}-block`,resourceType:"material",resourceCode:String(blockCode),resourceName:`Block de hormigón ${inch} in estándar`,aliases:[`block ${inch}`,`bloque ${inch} pulgadas`],unit:"ud",coefficient:12.5,wastePercentage:3,required:true,preferredCategory:"Mampostería",notes:"Manual: 12.5 ud/m² + 3% desperdicio."}),
    rr({id:`b${inch}-cement`,resourceType:"material",resourceCode:"MAT-03-000024",resourceName:"Cemento gris Portland Tipo I 42.5 kg",aliases:["cemento","cemento portland"],unit:"kg",coefficient:Number(mortar)*340,wastePercentage:0,required:true,notes:`Mortero 1:3: ${mortar} m³/m² × 340 kg cemento/m³.`}),
    rr({id:`b${inch}-sand`,resourceType:"material",resourceCode:"MAT-03-000029",resourceName:"Arena lavada para hormigón",aliases:["arena","arena lavada","arena mortero"],unit:"m³",coefficient:Number(mortar)*0.99,wastePercentage:0,required:true,notes:`Mortero 1:3: ${mortar} m³/m² × 0.99 m³ arena/m³.`}),
    rr({id:`b${inch}-labor`,resourceType:"labor",resourceCode:"MO-04-000019",resourceName:"Albañil de mampostería",aliases:["albañil","colocación de block"],unit:"hora",coefficient:0.8,wastePercentage:0,required:true}),
    rr({id:`b${inch}-helper`,resourceType:"labor",resourceCode:"MO-04-000020",resourceName:"Ayudante de albañil",aliases:["ayudante de albañil","ayudante"],unit:"hora",coefficient:0.8,wastePercentage:0,required:true})
  ],assumptions:["Muro no reforzado salvo que la descripción indique refuerzo.","Mortero de juntas 1:3."],warnings:["Refuerzo, cámaras llenas, dinteles y elementos estructurales se agregan según planos."]})),

  rule({id:"nexus-rule-manual-beam-rc",code:"NEXUS-MAN-EST-VIG",name:"Viga de hormigón armado - plantilla base",...common("concrete","m³","Composición por m³ de viga de hormigón armado tomada del ejemplo cuantificado del Manual."),aliases:["viga de hormigón armado","viga de concreto armado","viga estructural"],keywords:["viga","hormigón","acero","encofrado"],resourceRules:[
    rr({id:"vig-conc",resourceType:"material",resourceName:"Hormigón estructural",aliases:["hormigón","concreto"],unit:"m³",coefficient:1.03,wastePercentage:0,required:true,notes:"Manual: 1.03 m³ por m³ de viga."}),
    rr({id:"vig-steel",resourceType:"material",resourceName:"Acero corrugado de refuerzo",aliases:["acero","varilla corrugada"],unit:"kg",coefficient:4.44*45.3592,wastePercentage:0,required:true,notes:"Manual: 4.44 qq/m³; normalizado a kg."}),
    rr({id:"vig-wood",resourceType:"material",resourceName:"Madera para encofrado",aliases:["madera encofrado","madera"],unit:"pie²",coefficient:45.36,wastePercentage:0,required:true}),
    rr({id:"vig-wire",resourceType:"material",resourceName:"Alambre recocido negro calibre 18",aliases:["alambre #18","alambre de amarre"],unit:"lb",coefficient:9,wastePercentage:0,required:false}),
    rr({id:"vig-nail",resourceType:"material",resourceName:"Clavo de acero",aliases:["clavo acero"],unit:"lb",coefficient:4,wastePercentage:0,required:false}),
    rr({id:"vig-carp",resourceType:"labor",resourceName:"Carpintero de encofrado",aliases:["carpintero","encofrador"],unit:"hora",coefficient:2.272,wastePercentage:0,required:true,notes:"Manual: 11.36 m de M.O. carpintero para relación 5 m/0.44 m³; se conserva como coeficiente operativo a revisar."}),
    rr({id:"vig-vib",resourceType:"equipment",resourceName:"Vibrador de hormigón",aliases:["vibrador","vibrador concreto"],unit:"m³",coefficient:1,wastePercentage:0,required:true})
  ],assumptions:["Plantilla base derivada del ejemplo del Manual."],warnings:["Cuantía de acero y encofrado deben recalcularse desde planos estructurales cuando estén disponibles."]}),

  rule({id:"nexus-rule-manual-slab-rc",code:"NEXUS-MAN-EST-LOS",name:"Losa de hormigón armado - plantilla base",...common("concrete","m³","Composición por m³ de losa armada tomada del ejemplo del Manual."),aliases:["losa de hormigón armado","losa de concreto armado","losa estructural"],keywords:["losa","hormigón","acero","encofrado"],resourceRules:[
    rr({id:"los-conc",resourceType:"material",resourceName:"Hormigón estructural",aliases:["hormigón","concreto"],unit:"m³",coefficient:1.03,wastePercentage:0,required:true}),
    rr({id:"los-steel",resourceType:"material",resourceName:"Acero corrugado de refuerzo",aliases:["acero","varilla corrugada"],unit:"kg",coefficient:1.62*45.3592,wastePercentage:0,required:true,notes:"Manual: 1.62 qq/m³; normalizado a kg."}),
    rr({id:"los-wood",resourceType:"material",resourceName:"Madera para encofrado",aliases:["madera","encofrado"],unit:"pie²",coefficient:11.01,wastePercentage:0,required:true}),
    rr({id:"los-ply",resourceType:"material",resourceName:"Plywood para encofrado",aliases:["plywood","playwood","plywood encofrado"],unit:"plancha",coefficient:0.35,wastePercentage:0,required:true}),
    rr({id:"los-wire",resourceType:"material",resourceName:"Alambre recocido negro calibre 18",aliases:["alambre #18","alambre amarre"],unit:"lb",coefficient:3.24,wastePercentage:0,required:false}),
    rr({id:"los-vib",resourceType:"equipment",resourceName:"Vibrador de hormigón",aliases:["vibrador"],unit:"m³",coefficient:1,wastePercentage:0,required:true})
  ],assumptions:["Plantilla base derivada del ejemplo del Manual."],warnings:["Espesor, cuantía de acero, apuntalamiento y encofrado deben ajustarse desde planos."]}),

];
