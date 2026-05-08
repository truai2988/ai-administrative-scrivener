export interface ComputedRule {
  targetField: string;
  dependencies: string[];
  logic: string;
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
}
