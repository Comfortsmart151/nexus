import { INITIAL_LIBRARY_RESOURCES } from "@/data/librarySeed";
import { librarySearchScore } from "@/services/librarySearch.service";
import NEXUS_MASTER_LIBRARY_JSON from "@/data/nexusMasterLibrary.json";
import { LocalStorageRepository } from "@/repositories/localStorage.repository";

import type { ResourceType } from "@/types/budget";
import type {
  CreateLibraryResourceInput,
  LibraryPriceHistoryEntry,
  LibraryResource,
  UpdateLibraryResourceInput,
} from "@/types/library";

const LIBRARY_KEY = "nexus-library-resources";
const LIBRARY_COUNTER_KEY = "nexus-library-counter";
const LIBRARY_OVERRIDES_KEY = "nexus-library-overrides";
const LIBRARY_SEEDED_KEY = "nexus-library-seeded";
const NEXUS_MASTER_VERSION_KEY = "nexus-master-library-version";
const NEXUS_MASTER_VERSION = "2026.09.09-price-audit-01";
const LEGACY_MATERIALS_RECOVERY: CreateLibraryResourceInput[] = [
  { code: "MAT-HIST-00001", type: "material", name: "Cemento gris", unit: "funda", defaultUnitPrice: 140, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Precio de referencia histórico extraído del Manual de Costos." },
  { code: "MAT-HIST-00002", type: "material", name: "Arena de Itabo", unit: "m³", defaultUnitPrice: 550, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Arena utilizada en morteros y hormigones." },
  { code: "MAT-HIST-00003", type: "material", name: "Arena de Itabo sucia", unit: "m³", defaultUnitPrice: 420, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Precio de referencia histórico." },
  { code: "MAT-HIST-00004", type: "material", name: "Arena de Itabo lavada", unit: "m³", defaultUnitPrice: 580, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Arena lavada para morteros y hormigones." },
  { code: "MAT-HIST-00005", type: "material", name: "Arena de planta", unit: "m³", defaultUnitPrice: 550, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Precio de referencia histórico." },
  { code: "MAT-HIST-00006", type: "material", name: "Arena azul", unit: "m³", defaultUnitPrice: 600, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Arena fina utilizada principalmente en morteros de pañete." },
  { code: "MAT-HIST-00007", type: "material", name: "Grava limpia", unit: "m³", defaultUnitPrice: 600, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Agregado para hormigones." },
  { code: "MAT-HIST-00008", type: "material", name: "Grava sucia", unit: "m³", defaultUnitPrice: 540, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Precio de referencia histórico." },
  { code: "MAT-HIST-00009", type: "material", name: "Madera para encofrado", unit: "pie²", defaultUnitPrice: 30, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Madera de referencia para charrancha, encofrados y andamios." },
  { code: "MAT-HIST-00010", type: "material", name: "Clavos", unit: "lb", defaultUnitPrice: 30, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Clavos para trabajos provisionales y encofrados." },
  { code: "MAT-HIST-00011", type: "material", name: "Hilo de construcción", unit: "lb", defaultUnitPrice: 200, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Hilo utilizado para replanteo y alineación." },
  { code: "MAT-HIST-00012", type: "material", name: "Cal", unit: "funda", defaultUnitPrice: 80, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Material de referencia para replanteos y morteros." },
  { code: "MAT-HIST-00013", type: "material", name: "Caliche", unit: "m³", defaultUnitPrice: 200, supplier: "Manual de Costos — precio histórico; actualizar antes de usar", description: "Material de relleno compactado." },
];


export class LibraryService {
  /**
   * La Biblioteca Maestra vive en el bundle de NEXUS. LocalStorage guarda
   * únicamente recursos creados por el usuario y overrides del maestro.
   * Esto evita exceder la cuota del navegador al persistir miles de fichas.
   */
  static findAll(): LibraryResource[] {
    const master = (NEXUS_MASTER_LIBRARY_JSON as unknown as LibraryResource[]).map(
      (resource, index) => LibraryService.normalizeResource(resource, index),
    );
    const overrides =
      LocalStorageRepository.get<Record<string, Partial<LibraryResource>>>(LIBRARY_OVERRIDES_KEY) ?? {};
    const localResources =
      LocalStorageRepository.get<Partial<LibraryResource>[]>(LIBRARY_KEY) ?? [];

    const masterIds = new Set(master.map((resource) => resource.id));
    const mergedMaster = master.map((resource) =>
      LibraryService.normalizeResource({ ...resource, ...(overrides[resource.id] ?? {}) }, 0),
    );
    const localOnly = localResources
      .filter((resource) => resource.id && !masterIds.has(resource.id))
      .map((resource, index) => LibraryService.normalizeResource(resource, master.length + index));

    return [...mergedMaster, ...localOnly];
  }

  /**
   * Convierte instalaciones anteriores que guardaban la Biblioteca Maestra
   * completa en LocalStorage al modelo liviano master + overrides + locales.
   * No borra proyectos ni APU: solo compacta el almacenamiento de Biblioteca.
   */
  static migrateNexusMasterLibrary(): { inserted: number; updated: number; preservedLocal: number } {
    if (typeof window === "undefined") return { inserted: 0, updated: 0, preservedLocal: 0 };

    const incoming = (NEXUS_MASTER_LIBRARY_JSON as unknown as LibraryResource[]).map(
      (resource, index) => LibraryService.normalizeResource(resource, index),
    );
    const incomingById = new Map(incoming.map((resource) => [resource.id, resource]));
    const previousStored = LocalStorageRepository.get<Partial<LibraryResource>[]>(LIBRARY_KEY) ?? [];
    const existingOverrides =
      LocalStorageRepository.get<Record<string, Partial<LibraryResource>>>(LIBRARY_OVERRIDES_KEY) ?? {};
    const legacySeedCodes = new Set(
      INITIAL_LIBRARY_RESOURCES.map((r) => r.code?.trim().toLowerCase()).filter((v): v is string => Boolean(v)),
    );

    const overrides: Record<string, Partial<LibraryResource>> = { ...existingOverrides };
    const localOnly: LibraryResource[] = [];
    let updated = 0;

    previousStored.forEach((raw, index) => {
      const resource = LibraryService.normalizeResource(raw, index);
      const master = incomingById.get(resource.id);
      if (master) {
        // Conservamos preferencias del usuario. Los precios/fuentes del nuevo
        // maestro prevalecen para que las actualizaciones masivas sí lleguen.
        const patch: Partial<LibraryResource> = { ...(overrides[resource.id] ?? {}) };
        if (resource.isFavorite !== master.isFavorite) patch.isFavorite = resource.isFavorite;
        if (resource.isActive !== master.isActive) patch.isActive = resource.isActive;
        if (Object.keys(patch).length > 0) overrides[resource.id] = patch;
        updated += 1;
        return;
      }

      const code = resource.code.trim().toLowerCase();
      if (legacySeedCodes.has(code) && !code.startsWith("mat-hist-")) return;
      localOnly.push(resource);
    });

    // Las escrituras ahora son pequeñas: solo locales y overrides, nunca 4,665 fichas.
    LocalStorageRepository.save(LIBRARY_KEY, localOnly);
    LocalStorageRepository.save(LIBRARY_OVERRIDES_KEY, overrides);
    LocalStorageRepository.save(NEXUS_MASTER_VERSION_KEY, NEXUS_MASTER_VERSION);
    LocalStorageRepository.save(LIBRARY_SEEDED_KEY, true);

    return {
      inserted: Math.max(0, incoming.length - updated),
      updated,
      preservedLocal: localOnly.length,
    };
  }

  static findActive(): LibraryResource[] {
    return LibraryService.findAll().filter(
      (resource) => resource.isActive !== false,
    );
  }

  static findFavorites(): LibraryResource[] {
    return LibraryService.findActive()
      .filter((resource) => resource.isFavorite)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  static findById(resourceId: string): LibraryResource | null {
    return (
      LibraryService.findAll().find(
        (resource) => resource.id === resourceId,
      ) ?? null
    );
  }

  static findByType(type: ResourceType): LibraryResource[] {
    return LibraryService.findActive()
      .filter((resource) => resource.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  static findByCategory(category: string): LibraryResource[] {
    const normalizedCategory = category.trim().toLowerCase();

    return LibraryService.findActive()
      .filter(
        (resource) =>
          resource.category?.trim().toLowerCase() ===
          normalizedCategory,
      )
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  static getCategories(type?: ResourceType): string[] {
    const resources = type
      ? LibraryService.findByType(type)
      : LibraryService.findActive();

    return Array.from(
      new Set(
        resources
          .map((resource) => resource.category?.trim() ?? "")
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }

  static getSubcategories(
    category?: string,
    type?: ResourceType,
  ): string[] {
    let resources = type
      ? LibraryService.findByType(type)
      : LibraryService.findActive();

    if (category?.trim()) {
      const normalizedCategory = category.trim().toLowerCase();

      resources = resources.filter(
        (resource) =>
          resource.category?.trim().toLowerCase() ===
          normalizedCategory,
      );
    }

    return Array.from(
      new Set(
        resources
          .map((resource) => resource.subcategory?.trim() ?? "")
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }

  static search(
    query: string,
    type?: ResourceType,
  ): LibraryResource[] {
    const resources = type
      ? LibraryService.findByType(type)
      : LibraryService.findActive();

    if (!query.trim()) return resources;

    return resources
      .map((resource) => ({ resource, score: librarySearchScore(resource, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.resource.name.localeCompare(b.resource.name, "es"))
      .map(({ resource }) => resource);
  }

  static create(
    input: CreateLibraryResourceInput,
  ): LibraryResource {
    const resources = LibraryService.findAll();

    const storedCounter =
      LocalStorageRepository.get<number>(
        LIBRARY_COUNTER_KEY,
      ) ?? 0;

    const inferredCounter =
      LibraryService.getHighestResourceNumber(resources);

    const nextCounter =
      Math.max(storedCounter, inferredCounter) + 1;

    const now = new Date().toISOString();
    const price = LibraryService.sanitizeNumber(
      input.defaultUnitPrice,
    );

    const resourceId = `LIB-${String(nextCounter).padStart(
      6,
      "0",
    )}`;

    const resource: LibraryResource = {
      id: resourceId,
      code:
        input.code?.trim() ||
        LibraryService.generateCode(input.type, nextCounter),
      type: input.type,
      name: input.name.trim(),
      unit: input.unit.trim(),
      defaultUnitPrice: price,

      description: input.description?.trim() || "",
      supplier: input.supplier?.trim() || "",

      category: input.category?.trim() || "",
      subcategory: input.subcategory?.trim() || "",
      brand: input.brand?.trim() || "",
      tags: LibraryService.normalizeTags(input.tags ?? []),
      observations: input.observations?.trim() || "",
      source: input.source?.trim() || "",
      suggestedWastePercent: input.suggestedWastePercent,
      dataReviewedAt: input.dataReviewedAt,
      priceValidatedAt: input.priceValidatedAt,

      isFavorite: input.isFavorite ?? false,
      isActive: true,

      priceUpdatedAt: input.priceUpdatedAt ?? now,
      priceHistory: [
        LibraryService.createPriceHistoryEntry(
          resourceId,
          price,
          input.supplier,
          now,
        ),
      ],

      createdAt: now,
      updatedAt: now,
    };

    const storedLocal = LocalStorageRepository.get<LibraryResource[]>(LIBRARY_KEY) ?? [];
    LocalStorageRepository.save(LIBRARY_KEY, [...storedLocal, resource]);

    LocalStorageRepository.save(
      LIBRARY_COUNTER_KEY,
      nextCounter,
    );

    return resource;
  }

  /**
   * Repara duplicados accidentales creados por versiones anteriores del seed.
   * Solo actúa sobre códigos que pertenecen a la biblioteca semilla y que
   * aparecen más de una vez. Conserva la versión con mayor información
   * estructurada (normalización) y combina el historial de precios.
   */
  static repairSeedDuplicates(): number {
    const resources = LibraryService.findAll();
    const seedCodes = new Set(
      INITIAL_LIBRARY_RESOURCES
        .map((input) => input.code?.trim().toLowerCase())
        .filter((code): code is string => Boolean(code)),
    );

    const grouped = new Map<string, LibraryResource[]>();

    resources.forEach((resource) => {
      const code = resource.code.trim().toLowerCase();
      if (!seedCodes.has(code)) return;

      const group = grouped.get(code) ?? [];
      group.push(resource);
      grouped.set(code, group);
    });

    const duplicateIds = new Set<string>();
    const replacements = new Map<string, LibraryResource>();
    let removedCount = 0;

    grouped.forEach((group, code) => {
      if (group.length < 2) return;

      const seed = INITIAL_LIBRARY_RESOURCES.find(
        (input) => input.code?.trim().toLowerCase() === code,
      );

      const score = (resource: LibraryResource): number => {
        let value = 0;
        if (resource.source?.trim()) value += 8;
        if (resource.suggestedWastePercent !== undefined) value += 8;
        if (resource.dataReviewedAt) value += 4;
        if (resource.priceValidatedAt) value += 4;
        if (resource.subcategory?.trim()) value += 3;
        if (resource.category?.trim() && resource.category.trim().toLowerCase() !== "banco apu") value += 5;
        if (seed && resource.name.trim().toLowerCase() !== seed.name.trim().toLowerCase()) value += 6;
        return value;
      };

      const ordered = [...group].sort((a, b) => {
        const scoreDifference = score(b) - score(a);
        if (scoreDifference !== 0) return scoreDifference;
        return a.createdAt.localeCompare(b.createdAt);
      });

      const keeper = ordered[0];
      const duplicates = ordered.slice(1);
      const historyBySignature = new Map<string, LibraryPriceHistoryEntry>();

      [...keeper.priceHistory, ...duplicates.flatMap((item) => item.priceHistory)].forEach((entry) => {
        const signature = `${entry.price}|${entry.supplier ?? ""}|${entry.registeredAt}`;
        if (!historyBySignature.has(signature)) historyBySignature.set(signature, entry);
      });

      replacements.set(keeper.id, {
        ...keeper,
        priceHistory: Array.from(historyBySignature.values()).sort((a, b) =>
          a.registeredAt.localeCompare(b.registeredAt),
        ),
      });

      duplicates.forEach((resource) => {
        duplicateIds.add(resource.id);
        removedCount += 1;
      });
    });

    if (removedCount > 0) {
      const repaired = resources
        .filter((resource) => !duplicateIds.has(resource.id))
        .map((resource) => replacements.get(resource.id) ?? resource);
      LocalStorageRepository.save(LIBRARY_KEY, repaired);
    }

    return removedCount;
  }

  /**
   * v0.5.3: recupera los 13 materiales históricos del seed original que
   * compartían códigos MAT-00001..MAT-00013 con la biblioteca maestra v0.3.
   * Usa códigos MAT-HIST estables para que nunca vuelvan a colisionar.
   * Es idempotente: no crea una segunda copia si ya existe el código de
   * recuperación o el mismo recurso histórico por nombre + proveedor.
   */
  static restoreLegacyHistoricalMaterials(): number {
    const resources = LibraryService.findAll();
    let createdCount = 0;

    LEGACY_MATERIALS_RECOVERY.forEach((input) => {
      const recoveryCode = input.code?.trim().toLowerCase();
      // v0.5.3: la identidad de recuperación se determina SOLO por el código
      // MAT-HIST estable. El nombre no se usa como bloqueo porque un material
      // maestro puede llamarse igual que el registro histórico y ambos deben
      // poder coexistir con procedencias/precios distintos.
      const alreadyExists = resources.some((resource) =>
        Boolean(
          recoveryCode &&
            resource.code.trim().toLowerCase() === recoveryCode,
        ),
      );

      if (!alreadyExists) {
        const created = LibraryService.create(input);
        resources.push(created);
        createdCount += 1;
      }
    });

    return createdCount;
  }

  static seedInitialLibrary(): number {
    const currentResources = LibraryService.findAll();
    let createdCount = 0;

    INITIAL_LIBRARY_RESOURCES.forEach((input) => {
      const inputCode = input.code?.trim().toLowerCase();

      const alreadyExists = currentResources.some((resource) => {
        if (inputCode && resource.code.trim().toLowerCase() === inputCode) {
          return true;
        }

        return (
          resource.type === input.type &&
          resource.name.trim().toLowerCase() === input.name.trim().toLowerCase()
        );
      });

      if (!alreadyExists) {
        const created = LibraryService.create(input);
        currentResources.push(created);
        createdCount += 1;
      }
    });

    LocalStorageRepository.save(LIBRARY_SEEDED_KEY, true);

    return createdCount;
  }

  static update(
    resourceId: string,
    input: UpdateLibraryResourceInput,
  ): LibraryResource | null {
    const resources = LibraryService.findAll();

    const resourceIndex = resources.findIndex(
      (resource) => resource.id === resourceId,
    );

    if (resourceIndex === -1) {
      return null;
    }

    const currentResource = resources[resourceIndex];
    const now = new Date().toISOString();

    const nextPrice =
      input.defaultUnitPrice !== undefined
        ? LibraryService.sanitizeNumber(
            input.defaultUnitPrice,
          )
        : currentResource.defaultUnitPrice;

    const priceChanged =
      input.defaultUnitPrice !== undefined &&
      nextPrice !== currentResource.defaultUnitPrice;

    const nextSupplier =
      input.supplier !== undefined
        ? input.supplier.trim()
        : currentResource.supplier;

    const nextPriceHistory = priceChanged
      ? [
          ...currentResource.priceHistory,
          LibraryService.createPriceHistoryEntry(
            currentResource.id,
            nextPrice,
            nextSupplier,
            now,
          ),
        ]
      : currentResource.priceHistory;

    const updatedResource: LibraryResource = {
      ...currentResource,

      code:
        input.code !== undefined
          ? input.code.trim() || currentResource.code
          : currentResource.code,

      name:
        input.name !== undefined
          ? input.name.trim() || currentResource.name
          : currentResource.name,

      unit:
        input.unit !== undefined
          ? input.unit.trim() || currentResource.unit
          : currentResource.unit,

      defaultUnitPrice: nextPrice,

      description:
        input.description !== undefined
          ? input.description.trim()
          : currentResource.description,

      supplier: nextSupplier,

      category:
        input.category !== undefined
          ? input.category.trim()
          : currentResource.category,

      subcategory:
        input.subcategory !== undefined
          ? input.subcategory.trim()
          : currentResource.subcategory,

      brand:
        input.brand !== undefined
          ? input.brand.trim()
          : currentResource.brand,

      tags:
        input.tags !== undefined
          ? LibraryService.normalizeTags(input.tags)
          : currentResource.tags,

      observations:
        input.observations !== undefined
          ? input.observations.trim()
          : currentResource.observations,

      source:
        input.source !== undefined ? input.source.trim() : currentResource.source,
      suggestedWastePercent:
        input.suggestedWastePercent !== undefined ? input.suggestedWastePercent : currentResource.suggestedWastePercent,
      dataReviewedAt:
        input.dataReviewedAt !== undefined ? input.dataReviewedAt : currentResource.dataReviewedAt,
      priceValidatedAt:
        input.priceValidatedAt !== undefined ? input.priceValidatedAt : currentResource.priceValidatedAt,

      isFavorite:
        input.isFavorite ?? currentResource.isFavorite,

      isActive: input.isActive ?? currentResource.isActive,

      priceUpdatedAt:
        input.priceUpdatedAt ??
        (priceChanged
          ? now
          : currentResource.priceUpdatedAt),

      priceHistory: nextPriceHistory,
      updatedAt: now,
    };

    const masterIds = new Set(
      (NEXUS_MASTER_LIBRARY_JSON as unknown as LibraryResource[]).map((resource) => resource.id),
    );

    if (masterIds.has(resourceId)) {
      const overrides = LocalStorageRepository.get<Record<string, Partial<LibraryResource>>>(LIBRARY_OVERRIDES_KEY) ?? {};
      overrides[resourceId] = updatedResource;
      LocalStorageRepository.save(LIBRARY_OVERRIDES_KEY, overrides);
    } else {
      const storedLocal = LocalStorageRepository.get<LibraryResource[]>(LIBRARY_KEY) ?? [];
      const localIndex = storedLocal.findIndex((resource) => resource.id === resourceId);
      if (localIndex >= 0) storedLocal[localIndex] = updatedResource;
      else storedLocal.push(updatedResource);
      LocalStorageRepository.save(LIBRARY_KEY, storedLocal);
    }

    return updatedResource;
  }

  static toggleFavorite(
    resourceId: string,
  ): LibraryResource | null {
    const resource = LibraryService.findById(resourceId);

    if (!resource) {
      return null;
    }

    return LibraryService.update(resourceId, {
      isFavorite: !resource.isFavorite,
    });
  }

  static activate(resourceId: string): boolean {
    return Boolean(
      LibraryService.update(resourceId, {
        isActive: true,
      }),
    );
  }

  static deactivate(resourceId: string): boolean {
    return Boolean(
      LibraryService.update(resourceId, {
        isActive: false,
      }),
    );
  }


  static mergeInto(sourceId: string, targetId: string): LibraryResource | null {
    if (sourceId === targetId) return null;
    const source = LibraryService.findById(sourceId);
    const target = LibraryService.findById(targetId);
    if (!source || !target) return null;

    const mergedHistory = [...target.priceHistory, ...source.priceHistory]
      .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt))
      .filter((entry, index, all) => index === all.findIndex((other) =>
        other.price === entry.price && other.registeredAt === entry.registeredAt &&
        (other.supplier ?? "") === (entry.supplier ?? "")));

    const merged = LibraryService.update(targetId, {
      tags: Array.from(new Set([...target.tags, ...source.tags, "recurso-fusionado"])),
      observations: [target.observations, source.observations, `Fusionado con ${source.code} — ${source.name}`].filter(Boolean).join(" | "),
    });
    if (!merged) return null;

    // El historial combinado se persiste como override compacto solo para el destino.
    const overrides = LocalStorageRepository.get<Record<string, Partial<LibraryResource>>>(LIBRARY_OVERRIDES_KEY) ?? {};
    overrides[targetId] = { ...(overrides[targetId] ?? {}), priceHistory: mergedHistory };
    LocalStorageRepository.save(LIBRARY_OVERRIDES_KEY, overrides);
    LibraryService.update(sourceId, {
      isActive: false,
      observations: [source.observations, `Fusionado en ${target.code} — ${target.name}`].filter(Boolean).join(" | "),
    });
    return LibraryService.findById(targetId);
  }

  static applyNormalization(resourceId: string, changes: UpdateLibraryResourceInput): LibraryResource | null {
    return LibraryService.update(resourceId, changes);
  }

  static applyNormalizations(items: Array<{ resourceId: string; changes: UpdateLibraryResourceInput }>): number {
    let applied = 0;
    items.forEach((item) => {
      if (LibraryService.update(item.resourceId, item.changes)) applied += 1;
    });
    return applied;
  }

  static delete(resourceId: string): boolean {
    const resource = LibraryService.findById(resourceId);
    if (!resource) return false;

    const masterIds = new Set(
      (NEXUS_MASTER_LIBRARY_JSON as unknown as LibraryResource[]).map((item) => item.id),
    );
    if (masterIds.has(resourceId)) {
      return Boolean(LibraryService.update(resourceId, { isActive: false }));
    }

    const storedLocal = LocalStorageRepository.get<LibraryResource[]>(LIBRARY_KEY) ?? [];
    const filtered = storedLocal.filter((item) => item.id !== resourceId);
    if (filtered.length === storedLocal.length) return false;
    LocalStorageRepository.save(LIBRARY_KEY, filtered);
    return true;
  }

  static existsByName(
    name: string,
    type: ResourceType,
  ): boolean {
    const normalizedName = name.trim().toLowerCase();

    return LibraryService.findAll().some(
      (resource) =>
        resource.type === type &&
        resource.name.trim().toLowerCase() === normalizedName,
    );
  }

  static resetInitialLibrary(): void {
    LocalStorageRepository.remove(LIBRARY_KEY);
    LocalStorageRepository.remove(LIBRARY_OVERRIDES_KEY);
    LocalStorageRepository.remove(LIBRARY_COUNTER_KEY);
    LocalStorageRepository.remove(LIBRARY_SEEDED_KEY);
  }

  private static normalizeResource(
    resource: Partial<LibraryResource>,
    index: number,
  ): LibraryResource {
    const now = new Date().toISOString();

    const fallbackId = `LIB-${String(index + 1).padStart(
      6,
      "0",
    )}`;

    const id = resource.id ?? fallbackId;
    const price = LibraryService.sanitizeNumber(
      resource.defaultUnitPrice ?? 0,
    );

    const createdAt = resource.createdAt ?? now;
    const updatedAt = resource.updatedAt ?? createdAt;
    const priceUpdatedAt =
      resource.priceUpdatedAt ?? updatedAt;

    const priceHistory =
      resource.priceHistory &&
      resource.priceHistory.length > 0
        ? resource.priceHistory.map((entry, historyIndex) => ({
            id:
              entry.id ??
              `${id}-PRICE-${String(historyIndex + 1).padStart(
                4,
                "0",
              )}`,
            price: LibraryService.sanitizeNumber(entry.price),
            supplier: entry.supplier?.trim() || "",
            registeredAt:
              entry.registeredAt ?? priceUpdatedAt,
          }))
        : [
            LibraryService.createPriceHistoryEntry(
              id,
              price,
              resource.supplier,
              priceUpdatedAt,
            ),
          ];

    return {
      id,

      code:
        resource.code ??
        LibraryService.generateCode(
          resource.type ?? "material",
          index + 1,
        ),

      type: resource.type ?? "material",
      name: resource.name?.trim() || "Recurso sin nombre",
      unit: resource.unit?.trim() || "ud",
      defaultUnitPrice: price,

      description: resource.description?.trim() || "",
      supplier: resource.supplier?.trim() || "",

      category: resource.category?.trim() || "",
      subcategory: resource.subcategory?.trim() || "",
      brand: resource.brand?.trim() || "",
      tags: LibraryService.normalizeTags(resource.tags ?? []),
      observations: resource.observations?.trim() || "",
      source: resource.source?.trim() || "",
      suggestedWastePercent: Number.isFinite(resource.suggestedWastePercent) ? resource.suggestedWastePercent : undefined,
      dataReviewedAt: resource.dataReviewedAt || undefined,
      priceValidatedAt: resource.priceValidatedAt || undefined,

      isFavorite: resource.isFavorite ?? false,
      isActive: resource.isActive ?? true,

      priceUpdatedAt,
      priceHistory,

      createdAt,
      updatedAt,
    };
  }

  private static createPriceHistoryEntry(
    resourceId: string,
    price: number,
    supplier?: string,
    registeredAt?: string,
  ): LibraryPriceHistoryEntry {
    return {
      id: `${resourceId}-PRICE-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      price: LibraryService.sanitizeNumber(price),
      supplier: supplier?.trim() || "",
      registeredAt:
        registeredAt ?? new Date().toISOString(),
    };
  }

  private static normalizeTags(tags: string[]): string[] {
    return Array.from(
      new Set(
        tags
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => tag.toLowerCase()),
      ),
    );
  }

  private static sanitizeNumber(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }

    return value;
  }

  private static generateCode(
    type: ResourceType,
    number: number,
  ): string {
    const prefixes: Record<ResourceType, string> = {
      material: "MAT",
      labor: "LAB",
      equipment: "EQU",
      subcontract: "SUB",
    };

    return `${prefixes[type]}-${String(number).padStart(
      5,
      "0",
    )}`;
  }

  private static getHighestResourceNumber(
    resources: LibraryResource[],
  ): number {
    return resources.reduce((highest, resource) => {
      const match = resource.id.match(/^LIB-(\d+)$/);

      if (!match) {
        return highest;
      }

      return Math.max(highest, Number(match[1]));
    }, 0);
  }
}