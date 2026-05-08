export interface ComputedRule {
  readonly targetField: string;
  readonly dependencies: readonly string[];
  readonly logic: string;
}

export interface UiSection {
  readonly sectionKey: string;
  readonly sectionLabel: string;
  readonly fields: readonly { readonly fieldKey: string; readonly label: string; readonly inputType: string }[];
}

export interface FormUiConfig {
  formKey: string;
  formName: string;
  readonly sections: readonly UiSection[];
  readonly computedRules: readonly ComputedRule[];
  /** AI推論による初期フィールドマッピング（breadcrumbKey → sectionKey.fieldKey） */
  readonly fieldMappings?: Readonly<Record<string, string>>;
}
