import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import type { CompanySettings } from "@/types/settings";

const KEY = "nexus-company-settings";
const defaults: CompanySettings = {
  commercialName: "Ingeniería González",
  legalName: "",
  taxId: "",
  phone: "",
  email: "",
  address: "",
  responsibleName: "",
  responsibleTitle: "",
  defaultValidityDays: 15,
  defaultGeneralExpensesPercentage: 10,
  defaultContingencyPercentage: 5,
  defaultProfitPercentage: 10,
  defaultTaxPercentage: 18,
  defaultNotes: "Precios sujetos a revisión según alcance final y condiciones de obra.",
  documentPrefix: "NX-PRE",
  currency: "DOP",
  appTheme: "nexus-blue",
  appAppearance: "light",
  customPrimaryColor: "#2563eb",
  customAccentColor: "#38bdf8",
  documentPrimaryColor: "#1e40af",
  documentSecondaryColor: "#0f172a",
  documentAccentColor: "#2563eb",
  budgetTemplate: "corporate",
  documentShowCover: true,
  documentShowLogo: true,
  documentShowCompanyContact: true,
  documentShowClientDetails: true,
  documentShowUnitPrices: true,
  documentShowQuantities: true,
  documentShowTaxBreakdown: true,
  documentShowChapterSubtotals: true,
  documentShowAcceptance: true,
  updatedAt: new Date(0).toISOString(),
};

export class SettingsService {
  static get(): CompanySettings {
    return { ...defaults, ...(LocalStorageRepository.get<Partial<CompanySettings>>(KEY) ?? {}) };
  }
  static save(input: Partial<CompanySettings>): CompanySettings {
    const current = SettingsService.get();
    const next: CompanySettings = {
      ...current,
      ...input,
      defaultValidityDays: Math.max(1, Number(input.defaultValidityDays ?? current.defaultValidityDays) || 15),
      defaultGeneralExpensesPercentage: Math.max(0, Number(input.defaultGeneralExpensesPercentage ?? current.defaultGeneralExpensesPercentage) || 0),
      defaultContingencyPercentage: Math.max(0, Number(input.defaultContingencyPercentage ?? current.defaultContingencyPercentage) || 0),
      defaultProfitPercentage: Math.max(0, Number(input.defaultProfitPercentage ?? current.defaultProfitPercentage) || 0),
      defaultTaxPercentage: Math.max(0, Number(input.defaultTaxPercentage ?? current.defaultTaxPercentage) || 0),
      updatedAt: new Date().toISOString(),
    };
    LocalStorageRepository.save(KEY, next);
    return next;
  }
}
